import Koa from "koa";
import { KoaAdminCtx } from "../../types";
import { render_page } from "../../render";


export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  ctx.body = render_page("admin/backend.html",
    {
      sidebar: { title: "Sidekick.js" },
      header: { title: "Sidekick.js" },
      navigation: {
        tabs: [
          { label: "Overview", href: "/admin/users/overview", highlight: false },
          { label: "Add User", href: "/admin/users/add-user", highlight: true }
        ],
      },
      page: {
        users: {
          'add-user': true
        }
      }
    });
}



