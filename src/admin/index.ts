import Koa from "koa";
import Router from "koa-router";
import KoaBody from "koa-body";

// handlers
import { get_handler as admin_index_get, post_handler as admin_index_post } from "./routes/index";
import { get_handler as dashboard_get, } from "./routes/dashboard";
import { get_handler as logs_get, } from "./routes/logs";
import { get_handler as psql_overview_get, } from "./routes/postgres/overview";
import { get_handler as psql_tables_get, } from "./routes/postgres/tables";
import { get_handler as psql_tables_create_get, get_column_handler as psql_tables_create_column_get } from "./routes/postgres/tables.create";
import { get_handler as psql_types_get, } from "./routes/postgres/types";
import { get_handler as psql_functions_get, } from "./routes/postgres/functions";
import { get_handler as users_get, } from "./routes/users/index";
import { get_handler as users_overview_get, } from "./routes/users/overview";
import { get_handler as users_add_user_get, } from "./routes/users/add_user";
import { get_handler as routes_get, } from "./routes/routes";
import { get_handler as background_jobs_get, } from "./routes/background_jobs";
import { get_handler as graphql_get, } from "./routes/graphql";
import { get_handler as extensions_get, } from "./routes/extensions";
import { KoaAdminCtx } from "./types";


export const adminRouter = new Router({ prefix: "/admin" });


async function mw1(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  let counter = !!ctx.session ? ctx.session.counter : 0;
  console.log('mw1', ctx.session);
  await next();
}

/**
 * Koa middleware which lets the request through if session cookie is valid for admin 
 * @param ctx 
 * @param next 
 */
async function admin_check(ctx: KoaAdminCtx, next: Koa.Next) {
  // Dont check on /admin
  if (ctx.url === "/admin")
    await next();
    // TODO: remove local 
  else if (ctx.session.isAdmin || process.env.ENVIRONMENT === "local") {
    await next();
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
  adminRouter.get("/users/overview", users_overview_get);
  adminRouter.get("/users/add-user", mw1, users_add_user_get);
  adminRouter.get("/postgresql/overview", mw1, psql_overview_get);
  adminRouter.get("/postgresql/tables", mw1, psql_tables_get);
  adminRouter.get("/postgresql/tables/create", mw1, psql_tables_create_get);
  adminRouter.get("/postgresql/tables/create/column", mw1, psql_tables_create_column_get);
  adminRouter.get("/postgresql/functions", mw1, psql_functions_get);
  adminRouter.get("/postgresql/types", mw1, psql_types_get);
  adminRouter.get("/background_jobs", mw1, background_jobs_get);
  adminRouter.get("/graphql", mw1, graphql_get);
  adminRouter.get("/extensions", mw1, extensions_get);

}
