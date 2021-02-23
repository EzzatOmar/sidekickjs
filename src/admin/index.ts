import Koa, { ParameterizedContext, Next } from "koa";
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
import { RateLimiterMemory, IRateLimiterRes } from "rate-limiter-flexible";
import { customPages } from "./customAdmin";
import { render_custom_tab } from "./render";

// means that we have 5 points every 2 seconds
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 2, // Store number for two second
  blockDuration: 60, // Block for 1 minute
});

const rateLimitMW = async (ctx: ParameterizedContext, next: Next) => {
  try {
    await rateLimiter.consume(ctx.ip);
    try {
      await next();
    } catch (e) {
      if ((process.env.ENVIRONMENT as string).toLowerCase() !== 'prod') {
        console.log(e);
      }
      ctx.status = 500;
      return;
    }
  } catch (rejRes) {
    if ((process.env.ENVIRONMENT as string).toLowerCase() !== 'prod') {
      console.log(rejRes);
    }

    let r: IRateLimiterRes = rejRes;
    ctx.response.status = 429;
    ctx.response.body = 'Too Many Requests to admin path';
    // @ts-ignore
    ctx.response.set('Retry-After', '' + (r.msBeforeNext | 60000) / 1000);
  }
}

export const maxConsecutiveFailsByIP = 3;
/**
 * loginLimiter is used directly in the login handler
 */
export const loginLimiter = new RateLimiterMemory({
  points: maxConsecutiveFailsByIP,
  duration: 60 * 60 * 3, // Store number for three hours since first fail
  blockDuration: 60 * 15, // Block for 15 minutes
});

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
  else if (ctx.session.isAdmin) {
    await next();
  } else {
    // NOT AUTHORIZED, REDIRECTED TO /admin
    ctx.response.redirect("/admin");
  }
}

adminRouter.use(session({
  key: "SESSIONID",   //default "koa:sess"
  path: "/admin"
}));
adminRouter.use(KoaBody());
adminRouter.use(rateLimitMW);
// adminRouter.use(admin_check);
adminRouter.use((ctx: KoaAdminCtx, next: Koa.Next) => {
  ctx.admin = {
    render_custom_tab
  };
  next();
})

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

// add customAdmin routes
customPages.forEach(c => {
  // page redirect to first tab
  let pageLink = c.name.replace(/ /g, '-').toLocaleLowerCase();

  adminRouter.get(`/${pageLink}`, (ctx: KoaAdminCtx) => ctx.redirect(`/admin/${pageLink}/${c.tabs[0].name.replace(/ /g, '-').toLocaleLowerCase()}`));
  c.tabs.forEach(t => {
    if (t.handler.get)
      if (t.handler.get_mw)
        adminRouter.get(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.get_mw, t.handler.get);
      else
        adminRouter.get(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.get);

    if (t.handler.post)
      if (t.handler.post_mw)
        adminRouter.post(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.post_mw, t.handler.post);
      else
        adminRouter.get(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.post);

    if (t.handler.put)
      if (t.handler.put_mw)
        adminRouter.put(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.put_mw, t.handler.put);
      else
        adminRouter.put(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.put);

    if (t.handler.delete)
      if (t.handler.delete_mw)
        adminRouter.delete(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.delete_mw, t.handler.delete);
      else
        adminRouter.delete(`/${pageLink}/${t.name.replace(/ /g, '-').toLocaleLowerCase()}`, t.handler.delete);
  })
})