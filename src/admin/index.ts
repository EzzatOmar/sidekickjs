import Koa from "koa";
import Router from "koa-router";
import KoaBody from "koa-body";
import session from "koa-session";

// handlers
import {get_handler as admin_index_get, post_handler as admin_index_post} from "./routes/index"


export const adminRouter = new Router({prefix: "/admin"});


const CONFIG = {
  key: 'koa.sess', /** (string) cookie key (default is koa.sess) */
  /** (number || 'session') maxAge in ms (default is 1 days) */
  /** 'session' will result in a cookie that expires when session/browser is closed */
  /** Warning: If a session cookie is stolen, this cookie will never expire */
  maxAge: 86400000,
  autoCommit: true, /** (boolean) automatically commit headers (default true) */
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
  rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
  renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
  secure: true, /** (boolean) secure cookie*/
  sameSite: null, /** (string) session cookie sameSite options (default null, don't set it) */
};

async function mw1(ctx:Koa.ParameterizedContext, next:Koa.Next){
  let counter = !!ctx.session?ctx.session.counter:0; 
  console.log('mw1', ctx.session);
  next();
}

async function mw2(ctx:Koa.ParameterizedContext, next:Koa.Next){
  console.log('mw2');
  next();
}

// @ts-ignore
adminRouter.keys = ['some secret hurr'];

adminRouter.use(KoaBody());
// @ts-ignore
// adminRouter.use(session(adminRouter));

adminRouter.get("/", mw1, admin_index_get);
adminRouter.post("/", mw1, admin_index_post);
