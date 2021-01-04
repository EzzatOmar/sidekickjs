import Koa from "koa";
import { KoaAdminCtx, TableRow, SchemaTables } from "../../types";
import { render_page } from "../../render";
import { getClient } from "../../../database/core";
import { List } from "immutable";

const get_schema_stmt = `select schema_name
from information_schema.schemata
where schema_name not ilike 'pg_%'
and schema_name not ilike 'sidekick%'
AND schema_name not in ('information_schema', 'postgraphile_watch');`


export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {

  let schemas = await getClient().then(client => {
    client.query('SET ROLE sidekick_admin;', []);
    let res = client.query(get_schema_stmt, [])
    .then(x => x.rows as {schema_name: string} [])
    .then(x => x.map(x => x.schema_name));
    client.release();
    return res;
  })
  ctx.body = render_page("partials/backend/postgresql/tables.create.mustache",
  {
    schemas: {
      items: schemas,
      defaultItem: null
    }
     
  }
  )
}



