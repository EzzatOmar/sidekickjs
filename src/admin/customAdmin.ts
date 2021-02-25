import { getFileFromDir } from "../utils/files";
import { KoaAdminCtx } from "./types";
import Koa, { ParameterizedContext, Next } from "koa";


export interface HandlerObject {
  get?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
  get_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
  post?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
  post_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
  put?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
  put_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
  delete?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
  delete_mw?: (ctx: KoaAdminCtx, next?: Koa.Next) => void,
}

interface CustomPage {
  name: string,
  path: string,
  tabs: {
    name: string,
    url: string,
    subPageHandler: string[][],
    handler: HandlerObject
  }[]
}

export const customPages: CustomPage[] = [];


// fill custom pages
try {
  let handlerDirs = getFileFromDir('./custom/dist/admin', [], "handler\.js");
  let array = handlerDirs.map(path => {
    let [page] = path.split('/').splice(3);
    return page;
  })
  // if a path has more than 3 levels than we treat them not as page or tab data but for handler only
  let subPageHandler:string[][] = []

  let pageSet = new Set(array);
  let pageTabTuple: string[][] = handlerDirs.map(path => {
    let levels = path.split('/').slice(3);
    if (levels.length > 3) {
      subPageHandler.push(path.split('/'));
      return undefined
    };
    return levels.slice(0, 2).concat(path)
  }).filter(x => x !== undefined) as string[][];
  pageSet.forEach(pageName => {
    let tabPathTuple = pageTabTuple.filter(p => p[0] === pageName).map(p => [p[1], p[2]]);
    let path = pageTabTuple.filter(p => p[0] === pageName).map(p => p[2])[0];

    customPages.push(
      {
        name: pageName,
        path: path,
        tabs: tabPathTuple.map(([t, p]) => {
          let handler = require('../../' + p);

          return {
            name: t,
            subPageHandler: subPageHandler.filter(([,,,sPage, sTab]) => sPage === pageName && sTab === t),
            url: `/admin/${pageName.replace(/ /g, '-').toLocaleLowerCase()}/${t.replace(/ /g, '-').toLocaleLowerCase()}`,
            handler: {
              ...(handler.get ? { get: handler.get } : null),
              ...(handler.get_mw ? { get_mw: handler.get_mw } : null),
              ...(handler.post ? { post: handler.post } : null),
              ...(handler.post_mw ? { post_mw: handler.post_mw } : null),
              ...(handler.put ? { put: handler.put } : null),
              ...(handler.put_mw ? { put_mw: handler.put_mw } : null),
              ...(handler.delete ? { delete: handler.delete } : null),
              ...(handler.delete_mw ? { delete_mw: handler.delete_mw } : null),
            }
          }
        })
      }
    )
  })

} catch (err) {
  console.log(err, __dirname);
}