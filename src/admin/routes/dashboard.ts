import Koa from "koa";
import { KoaAdminCtx } from "../types";
import {render_page} from "../render";


export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) { 
  ctx.body = render_page("backend", 
    {body: {
      sidebar: {title: "Sidekick.js"},
      page: {
        dashboard: {}
     }},
     header: {title: "Sidekick.js"}});

}



