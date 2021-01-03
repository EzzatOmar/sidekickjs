import Koa from "koa";
import {render_page} from "../render";
import { KoaAdminCtx } from "../types";

/**
 * Shows the login page if the user is not logged in as admin.
 * If logged in then either show the dashboard or the welcome page.
 * @param ctx Includes the session
 * @param next 
 */
export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  if(ctx.session.isAdmin) {
    ctx.response.redirect('/admin/dashboard');
  } else {
    ctx.body = render_page("admin/login.html", {body: {title: "Sidekick.js"}});
  }
}

export async function post_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  let {password} : {password: string} = ctx.request.body;
  if(password === process.env.SIDEKICK_MASTER_PASSWORD) {
    ctx.session.isAdmin = true;
    ctx.response.redirect('/admin/dashboard');
  } else {
    ctx.body = "INVALID PASSWORD";
  }
}