import Koa from "koa";
import { KoaAdminCtx } from "../types";
import {render_page} from "../render";


export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) { 
  ctx.body = render_page("admin/backend.html", 
  {
    sidebar: { title: "Sidekick.js" },
    header: { title: "Sidekick.js" },
    page: {
      logs: {}
    }
  });

}



