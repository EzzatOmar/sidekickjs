import Koa from "koa";
import { KoaAdminCtx } from "../../types";
import { render_page } from "../../render";
import { PoolClient, } from "pg";
import { query, getClient } from "../../../database/core";

interface user { id: number, created_at: string, updated_at: string, blocked: boolean, username: string | null, email: string | null };
const get_user_stmt = `select u.*,ud.username, ud.email from sidekick.users u inner join sidekick.users_decoration ud ON u.id = ud.id;`;
async function get_users(): Promise<user[]> {
  return getClient()
    .then(async (client) => {
      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE sidekick_admin;');
        let res = await (await client.query(get_user_stmt)).rows;
        await client.query('COMMIT');
        return res as user[];
      } catch (err) {
        await client.query('ROLLBACK');
        console.log(err);
        return [];
      }
      finally {
        client.release();
      }
    })
}

export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  try {
    let user = await get_users();
    ctx.status = 200;
    ctx.body = render_page("backend",
      {
        sidebar: { title: "Sidekick.js" },
        header: { title: "Sidekick.js" },
        navigation: {
          tabs: [
            { label: "Overview", href: "/admin/users/overview", highlight: true },
            { label: "Add User", href: "/admin/users/add-user", highlight: false }
          ],
        },
        page: {
          users: {
            overview: {
              data: { user }}
          }
        }
      });
  } catch (err) {
    ctx.throw(err.code, err.message);
  }
}



