import {CustomParameterizedContext} from "./types";
import Koa, { Next } from "koa";
import { getFileFromDir } from "./utils/files";
import querystring from "querystring";
import KoaCompose from "koa-compose";

function getFiles(dirPath: string, regex?: string | undefined): string[] {
  return getFileFromDir(dirPath, [], regex);
}

let middleware_functions = {};
try {
  const mw_filenames = getFiles('./dist/middleware','.*js$');
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
    const mw_filenames = getFiles('./custom/dist/middleware','.*js$');
    mw_filenames.map(x => x.split('/').reverse()[0]).forEach(s => {
      try {
        const ex = require('../custom/dist/middleware/' + s);
        if(ex) Object.assign(middleware_functions, ex);
      } catch(err) {
      }
    })
  } catch(err) {
}

function pathToCategory(path: string){
  path = path.split('?')[0];
  if(path !== '/') {
    path = path.substring(1);
  }
  let splitDot = path.split('.');
  let lastDot = splitDot[splitDot.length - 1];
  let filename = path==='/'?'index': splitDot[0].endsWith('/')?splitDot[0].slice(0, -1):splitDot[0];
  return {
    slash: path.endsWith('/'),
    extension: lastDot.endsWith('/') || lastDot===filename || filename==='index' ?"html":lastDot,
    filename
  };
}

/**
 * returns filepath relative from the provided path
 * check tests in test/dynamic_middleware.ts
 */
function search_for_file_match(path:string, pagesDir:string):string | null {
  // get rid of starting ./
  pagesDir = pagesDir.startsWith('./')?pagesDir.substring(2):pagesDir;

  try {
      path = path.split('?')[0];
      let pathCategory = pathToCategory(path);
      let fileRegex:string;
      if(pathCategory.extension==='html') {
        fileRegex = `(${pathCategory.filename}|${pathCategory.filename}/index).*\.html`;
      } else {
        fileRegex = `${pathCategory.filename}.*\.${pathCategory.extension}`
      }
      let files = getFiles(pagesDir,fileRegex);
      if (files.length === 0) return null;

      let filtered = files.filter((file: string)=>{
        return new RegExp(`^${pathCategory.filename}.*${pathCategory.extension}`).test(file.substring(pagesDir.length + 1)); 
      })
      
      // if not trailing slash exclude index.*.html
      if(!pathCategory.slash) {
        filtered = filtered.filter((file: string)=>{
          let splitDot = file.split('/');
          let last = splitDot[splitDot.length - 1];
          return !(new RegExp(`index(\.(mw_.*)*)*html$`).test(last));
        })
      }
      
      // sort by longest dotSplit
      filtered.sort((a,b) => b.split('.').length - a.split('.').length)[0];

      // if trailing slash put index before
      if(pathCategory.slash) {
        filtered.sort((a,b) => a.includes("index")?-1:0);
      }
      return filtered[0];

  } catch(err) {
    return null;
  }
}

export async function dynamic_mw(ctx: CustomParameterizedContext, next: Next) {
    let path = search_for_file_match(ctx.url, 'custom/dist/pages');
    console.log('path', path, ctx.url);
    if(path) {
      path = path 
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
      console.log(path, mw)
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
  