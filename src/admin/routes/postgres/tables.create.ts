import Koa from "koa";
import { KoaAdminCtx, TableRow, SchemaTables } from "../../types";
import { render_partial } from "../../render";
import { getClient } from "../../../database/core";
import { List } from "immutable";
import Handlebars_ from "handlebars";

const get_schema_stmt = `select schema_name
from information_schema.schemata
where schema_name not ilike 'pg_%'
and schema_name not ilike 'sidekick%'
AND schema_name not in ('information_schema', 'postgraphile_watch');`

// TODO: do not allow names with whitespace
const restricted_table_names = [
  'query', 'mutations', 'subscriptions, node',
  'all',
  'analyse',
  'analyze',
  'and',
  'any',
  'array',
  'as',
  'asc',
  'asymmetric',
  'both',
  'case',
  'cast',
  'check',
  'collate',
  'column',
  'constraint',
  'create',
  'current_catalog',
  'current_date',
  'current_role',
  'current_time',
  'current_timestamp',
  'current_user',
  'default',
  'deferrable',
  'desc',
  'distinct',
  'do',
  'else',
  'end',
  'except',
  'false',
  'fetch',
  'for',
  'foreign',
  'from',
  'grant',
  'group',
  'having',
  'in',
  'initially',
  'intersect',
  'into',
  'lateral',
  'leading',
  'limit',
  'localtime',
  'localtimestamp',
  'not',
  'null',
  'offset',
  'on',
  'only',
  'or',
  'order',
  'placing',
  'primary',
  'references',
  'returning',
  'select',
  'session_user',
  'some',
  'symmetric',
  'table',
  'then',
  'to',
  'trailing',
  'true',
  'union',
  'unique',
  'user',
  'using',
  'variadic',
  'when',
  'where',
  'window',
  'with'
];

const adminHandlebars = Handlebars_.create();

function registerHandleBarsPartials(handlebars) {
  handlebars.registerHandleBarsPartials();

}

//NOTE: not all data types
//      custom enums are missing
const basicDataType = [
  'bool',
  'bytea	',
  'date',
  'float4',
  'float8	',
  'int',
  'int2',
  'int8',
  'json',
  'jsonb',
  'money',
  'serial2',
  'serial4',
  'serial8',
  'text',
  'time',
  'timestamp',
  'timestamptz',
  'timetz',
  'tsquery',
  'tsvector',
  'uuid',
  'xml',
];

export async function get_handler(ctx: KoaAdminCtx, next: Koa.Next) {

  let schemas = await getClient().then(client => {
    client.query('SET ROLE sidekick_admin;', []);
    let res = client.query(get_schema_stmt, [])
      .then(x => x.rows as { schema_name: string }[])
      .then(x => x.map(x => x.schema_name));
    client.release();
    return res;
  })
  ctx.body = render_partial("./resources/private/html/handlebars/partials/backend/postgresql/tables.create.handlebars",
    {
      schemas: {
        items: schemas,
        defaultItem: null
      },
      table_name: {
        input_group: {
          color: "indigo",
          id: "table-name",
          label: "table name",
          placeholder: "enter table name"
        }
      },
      columns: { 
        dataTypes: basicDataType,
        dataTypeDefault: "text"
      }

    }
  )
}

export async function get_column_handler(ctx: KoaAdminCtx, next: Koa.Next) {

  ctx.body = render_partial("./resources/private/html/handlebars/partials/backend/postgresql/tables.create.column.handlebars",
    {
      dataTypes: basicDataType,
      dataTypeDefault: "text"
    }
  )
}



