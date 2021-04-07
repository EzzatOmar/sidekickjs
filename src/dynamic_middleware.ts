import {CustomParameterizedContext} from "./types";
import Koa, { Next } from "koa";
import { getFileFromDir } from "./utils/files";
import querystring from "querystring";
import KoaCompose from "koa-compose";

let middleware_functions = {};
try {
  const mw_filenames = getFileFromDir('./dist/middleware', [], '.*js$');
  mw_filenames.map(x => x.split('/').reverse()[0]).forEach(s => {
    try {
      const ex = require('./middleware/' + s);
      if(ex) Object.assign(middleware_functions, ex);
    } catch(err) {
    }
  })
} catch(err) {
}

// look also custom/dist/middleware
try {
    const mw_filenames = getFileFromDir('./custom/dist/middleware', [], '.*js$');
    mw_filenames.map(x => x.split('/').reverse()[0]).forEach(s => {
      try {
        const ex = require('../custom/dist/middleware/' + s);
        if(ex) Object.assign(middleware_functions, ex);
      } catch(err) {
      }
    })
  } catch(err) {
}

function search_for_file_match(path:string) {
  try {
      path = path.split('?')[0];
      let splitDot = path.split('.');
      let extension = splitDot[splitDot.length - 1];
      let files = getFileFromDir('./custom/dist/pages', [], path);
      let path_ = path.split('/').splice(1).map(s => s===''?'index':s);
      console.log('path: ' + path)
      console.log('path_: ' + path_)
      let a = files.filter(s => {
        let s_ = s.split('/').splice(3).map(x => x.split('.')[0])
          return path==='/'?s.includes('index'):true && 
          (s_.join('/') === path_.join('/')
           || s_.join('/') + extension?"."+extension:'' === path_.join('/')
           || s_.join('/') === [...path_, 'index'].join('/'));
      });
      return a;
  } catch(err) {
    return [];
  }
}

export async function dynamic_mw(ctx: CustomParameterizedContext, next: Next) {
    let path = search_for_file_match(ctx.url).sort((a, b) => b.length - a.length)[0];
    console.log('dynamic mw: ', path, ctx.url, search_for_file_match(ctx.url).sort((a, b) => b.length - a.length))
    if(path) {
      let mw = path.split('.').filter(s => s.startsWith('mw_')).map(s => 
        {
          let [mw, args] = s.substr(3).split('?');
          // @ts-ignore
          let fn = middleware_functions[mw];
          if(fn){
            return {mw, fn, args: querystring.decode(args)}
          } else {
            console.log('Middlware not found: ', mw);
            return null;
          }
        }
      ).filter(x => x);
      // @ts-ignore
      ctx.sidekick.dynamicMiddleware = {path, mw};
      // need to replace the mw with fn where fn was resolved
      let callback:any;
      const n:Koa.Next = async () => {
        // trigger handler
        await next();
      };
      if(mw.length > 0){
        // compose mw
        // @ts-ignore
        let generatedMiddleware = KoaCompose(mw.map(x => x.fn));
        // @ts-ignore
        await generatedMiddleware(ctx, n);
      } else {
        await next();
      }
    } else {
      await next();
    }
  }
  