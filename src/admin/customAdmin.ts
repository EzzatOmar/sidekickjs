import { getFileFromDir } from "../utils/files";
import { KoaAdminCtx } from "./types";
import Koa, { ParameterizedContext, Next } from "koa";



interface CustomPage {
  name: string,
  path: string,
  tabs: {
    name: string,
    url: string,
    handler: {
      get?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
      get_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
      post?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
      post_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
      put?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
      put_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
      delete?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
      delete_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
    }
  }[]
}

export const customPages: CustomPage[] = [];


// add custom tabs
try {
  let handlerDirs = getFileFromDir('./custom/dist/admin', [], "handler\.js");
  let array = handlerDirs.map(path => {
    let [page] = path.split('/').splice(3);
    return page;
  })
  let pageSet = new Set(array);
  let pageTabTuple: string[][] = handlerDirs.map(path => path.split('/').slice(3).slice(0, 2).concat(path));
  pageSet.forEach(pageName => {
    let tabPathTuple = pageTabTuple.filter(p => p[0] === pageName).map(p => [p[1],p[2]]);
    let path = pageTabTuple.filter(p => p[0] === pageName).map(p => p[2])[0];
    
    customPages.push(
      {
        name: pageName,
        path: path,
        tabs: tabPathTuple.map(([t, p]) => {
          let handler = require('../../' + p);
          return {
            name: t,
            url: `/admin/${pageName.replace(/ /g, '-').toLocaleLowerCase()}/${t.replace(/ /g, '-').toLocaleLowerCase()}`,
            handler: {
              ...(handler.get ? {get: handler.get} : null),
              ...(handler.get_mw ? {get: handler.get_mw} : null),
              ...(handler.post ? {get: handler.post} : null),
              ...(handler.post_mw ? {get: handler.post_mw} : null),
              ...(handler.put ? {get: handler.put} : null),
              ...(handler.put_mw ? {get: handler.put_mw} : null),
              ...(handler.delete ? {get: handler.delete} : null),
              ...(handler.delete_mw ? {get: handler.delete_mw} : null),
            }
          }
        })
      }
    )
  })

} catch (err) {
  console.log(err, __dirname);
}