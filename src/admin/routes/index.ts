import Koa from "koa";
import { render_page } from "../render";
import { KoaAdminCtx } from "../types";
import { loginLimiter, maxConsecutiveFailsByIP } from "../index";
import { IRateLimiterRes } from "rate-limiter-flexible";

/**
 * Shows the login page if the user is not logged in as admin.
 * If logged in then either show the dashboard or the welcome page.
 * @param ctx Includes the session
 * @param next 
 */
export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  if (ctx.session.isAdmin) {
    ctx.response.redirect('/admin/dashboard');
  } else {
    ctx.body = render_page("admin/login.html", { body: { title: "Sidekick.js" } });
  }
}

export async function post_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  let rlRes = await loginLimiter.get(ctx.ip);
  if (rlRes !== null && rlRes.consumedPoints > maxConsecutiveFailsByIP) {
    const retrySecs = Math.round(rlRes.msBeforeNext / 1000) || 1;
    ctx.response.set('Retry-After', String(retrySecs));
    ctx.response.status = 429;
    ctx.response.body = 'Request limit reached: please wait 15 minutes.';
  } else {
    let { password }: { password: string } = ctx.request.body;
    if (password === process.env.SIDEKICK_MASTER_PASSWORD) {
      ctx.session.isAdmin = true;
      ctx.response.redirect('/admin/dashboard');
    } else {
      await loginLimiter.consume(ctx.ip)
        .then(res => {
          ctx.response.status = 401;
          ctx.response.body = "INVALID PASSWORD";
        }).catch(err => {
          let rlRes: IRateLimiterRes = err;
          const retrySecs = Math.round(rlRes.msBeforeNext || 60 * 60 * 1000 / 1000) || 1;
          ctx.response.set('Retry-After', String(retrySecs));
          ctx.response.status = 429;
          ctx.response.body = 'Request limit reached: please wait 15 minutes.';
        })
    }
  }
}