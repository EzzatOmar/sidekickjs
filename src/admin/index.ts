import Koa from "koa";
import Router from "koa-router";
import KoaBody from "koa-body";

// handlers
import { get_handler as admin_index_get, post_handler as admin_index_post } from "./routes/index";
import { get_handler as dashboard_get, } from "./routes/dashboard";
import { get_handler as logs_get, } from "./routes/logs";
import { get_handler as psql_get, } from "./routes/postgresql";
import { get_handler as users_get, } from "./routes/users/index";
import { get_handler as users_overview_get, } from "./routes/users/overview";
import { get_handler as users_add_user_get, } from "./routes/users/add_user";
import { get_handler as routes_get, } from "./routes/routes";
import { get_handler as background_jobs_get, } from "./routes/background_jobs";
import { KoaAdminCtx } from "./types";


export const adminRouter = new Router({ prefix: "/admin" });


async function mw1(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  let counter = !!ctx.session ? ctx.session.counter : 0;
  console.log('mw1', ctx.session);
  next();
}

/**
 * Koa middleware which lets the request through if session cookie is valid for admin 
 * @param ctx 
 * @param next 
 */
async function admin_check(ctx: KoaAdminCtx, next: Koa.Next) {
  // Dont check on /admin
  if (ctx.url === "/admin")
    next();
    // TODO: remove local 
  else if (ctx.session.isAdmin || process.env.ENVIRONMENT === "local") {
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
  adminRouter.get("/logs", mw1, logs_get);
  adminRouter.get("/routes", mw1, routes_get);
  adminRouter.get("/users", mw1, users_get);
  adminRouter.get("/users/overview", mw1, users_overview_get);
  adminRouter.get("/users/add-user", mw1, users_add_user_get);
  adminRouter.get("/postgresql", mw1, psql_get);
  adminRouter.get("/background_jobs", mw1, background_jobs_get);

}
