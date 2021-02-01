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
const session = require("koa-session2");

export const adminRouter = new Router({ prefix: "/admin" });

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

adminRouter.use(session({
  key: "SESSIONID",   //default "koa:sess"
  path: "/admin"
}));
adminRouter.use(KoaBody());
adminRouter.use(admin_check);

{
  adminRouter.get("/", admin_index_get);
  adminRouter.post("/", admin_index_post);
  adminRouter.get("/dashboard", dashboard_get);
  adminRouter.get("/logs", logs_get);
  adminRouter.get("/routes", routes_get);
  adminRouter.get("/users", users_get);
  adminRouter.get("/users/overview", users_overview_get);
  adminRouter.get("/users/add-user", users_add_user_get);
  adminRouter.get("/postgresql/overview", psql_overview_get);
  adminRouter.get("/postgresql/tables", psql_tables_get);
  adminRouter.get("/postgresql/tables/create", psql_tables_create_get);
  adminRouter.get("/postgresql/tables/create/column", psql_tables_create_column_get);
  adminRouter.get("/postgresql/functions", psql_functions_get);
  adminRouter.get("/postgresql/types", psql_types_get);
  adminRouter.get("/background_jobs", background_jobs_get);
  adminRouter.get("/graphql", graphql_get);
  adminRouter.get("/extensions", extensions_get);

}
