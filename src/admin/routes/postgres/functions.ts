import Koa from "koa";
import { KoaAdminCtx } from "../../types";
import {render_page} from "../../render";


export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) { 
  ctx.body = render_page("backend", 
  {
    navigation: {tabs: [
      {label: "Overview", href: "/admin/postgresql/overview", highlight: false},
      {label: "Tables", href: "/admin/postgresql/tables", highlight: false},
      {label: "Types", href: "/admin/postgresql/types", highlight: false},
      {label: "Functions", href: "/admin/postgresql/functions", highlight: true},
    ]},
    sidebar: { title: "Sidekick.js" },
    header: { title: "Sidekick.js" },
    page: {
      postgresql: {
        functions: { 
          
        }
      }    }
  });

}



