import Koa from "koa";
import Router from "koa-router";
import KoaBody from "koa-body";

// handlers
import {get_handler as admin_index_get, post_handler as admin_index_post} from "./routes/index"


export const adminRouter = new Router({prefix: "/admin"});


async function mw1(ctx:Koa.ParameterizedContext, next:Koa.Next){
  console.log('mw1');
  next();
}

async function mw2(ctx:Koa.ParameterizedContext, next:Koa.Next){
  console.log('mw2');
  next();
}

adminRouter.use(KoaBody());
adminRouter.get("/", mw1, admin_index_get);
adminRouter.post("/", admin_index_post);
