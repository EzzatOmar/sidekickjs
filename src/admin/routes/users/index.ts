import Koa from "koa";
import { KoaAdminCtx } from "../../types";

export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) { 
  ctx.response.redirect('/admin/users/overview');
}



