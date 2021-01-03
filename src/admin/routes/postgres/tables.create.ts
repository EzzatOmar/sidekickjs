import Koa from "koa";
import { KoaAdminCtx, TableRow, SchemaTables } from "../../types";
import { render_page } from "../../render";
import { getClient } from "../../../database/core";
import { List } from "immutable";




export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  ctx.body = render_page("partials/backend/postgresql/tables.create.mustache", {})

}



