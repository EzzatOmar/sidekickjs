import Koa from "koa";
import Router from "koa-router";
import KoaBody from "koa-body";

// handlers
import { get_handler as admin_index_get, post_handler as admin_index_post } from "./routes/index";
import { get_handler as dashboard_get, } from "./routes/dashboard";
import { KoaAdminCtx } from "./types";


export const adminRouter = new Router({ prefix: "/admin" });


async function mw1(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  let counter = !!ctx.session ? ctx.session.counter : 0;
  console.log('mw1', ctx.session);
  next();
}

async function admin_check(ctx: KoaAdminCtx, next: Koa.Next) {
  // Dont check on /admin
  if (ctx.url === "/admin")
    next();
  else if (ctx.session.isAdmin) {
    next();
  } else {
    // not admin
    //TODO: RATE LIMIT?
    ctx.response.redirect("/admin");
  }
}


adminRouter.use(KoaBody());
adminRouter.use(admin_check);

{
  adminRouter.get("/", mw1, admin_index_get);
  adminRouter.post("/", mw1, admin_index_post);
  adminRouter.get("/dashboard", mw1, dashboard_get);

}
