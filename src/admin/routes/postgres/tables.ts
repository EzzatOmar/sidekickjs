import Koa from "koa";
import { KoaAdminCtx, TableRow, SchemaTables } from "../../types";
import { render_page } from "../../render";
import { getClient } from "../../../database/core";
import { List } from "immutable";

const get_tables_stmt = `
with 
	schemas as (
    select schema_name
    from information_schema.schemata
    where schema_name not ilike 'pg_%'
    --and schema_name not ilike 'sidekick%'
    AND schema_name not in ('information_schema', 'postgraphile_watch')
	),
	primary_keys as (select * from sidekick.get_primary_keys()),
  foreign_keys as (select * from sidekick.get_foreign_keys()),
  unique_keys  as (select * from sidekick.get_unique_keys())
SELECT
    c.table_schema , c.table_name, c.column_name, c.ordinal_position, c.column_default, 
    c.is_nullable, c.data_type,
    (pk.column_name is not null) as is_primary_key,
    (fk.column_name is not null) as is_foreign_key,
    (uk.column_name is not null) as is_unique,
    (select * from col_description((c.table_schema || '.' || c.table_name)::regclass, c.ordinal_position)) as description
FROM
    information_schema.tables it
inner join schemas ON it.table_schema = schemas.schema_name
inner join information_schema.columns c on (c.table_schema = it.table_schema AND c.table_name = it.table_name)
left outer join primary_keys pk ON (pk.table_schema = c.table_schema AND pk.table_name = c.table_name AND pk.column_name = c.column_name)
left join foreign_keys fk ON fk.table_schema = c.table_schema AND fk.table_name = c.table_name AND fk.column_name = c.column_name
left join unique_keys  uk ON uk.table_schema = c.table_schema AND uk.table_name = c.table_name AND uk.column_name = c.column_name
WHERE
    table_type = 'BASE TABLE';
`;




export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {
  let tables = await getClient().then(async client => {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE sidekick_admin;");
    let res = (await client.query(get_tables_stmt, [])).rows as TableRow[];
    client.release();
    return res;
  });
  let table_data = List(tables).groupBy(x => x.table_schema)
  // @ts-ignore
  .reduce((r,v, k) => {
  // @ts-ignore
    let tables = v.groupBy(x => x.table_name).reduce((r, v, k) => {
      return [...r, {table_name: k, table_row: v.sortBy(x => x.ordinal_position).toArray()}]
    }, []);
    return [...r, {table_schema: k, tables}];
  }, []) as SchemaTables[];
  ctx.body = render_page("admin/backend.html",
    {
      navigation: {
        tabs: [
          { label: "Overview", href: "/admin/postgresql/overview", highlight: false },
          { label: "Tables", href: "/admin/postgresql/tables", highlight: true },
          { label: "Types", href: "/admin/postgresql/types", highlight: false },
          { label: "Functions", href: "/admin/postgresql/functions", highlight: false },
        ]
      },
      sidebar: { title: "Sidekick.js" },
      header: { title: "Sidekick.js" },
      page: {
        postgresql: {
          tables: {
            create_button: {
              'label': 'New Table',
              'bg-color': 'green',
              'aTag_attr': [
                'data-hx-target="#page-view"',
                'data-hx-get="/admin/postgresql/tables/create"'
              ]
             },
            table_data
          }
        }
      }
    });

}



