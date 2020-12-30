import { PoolClient } from "pg";
import { getFileFromDir } from "../utils/files";
import { yaml_to_db_config } from "../utils/yaml";
import { readFileSync } from "fs";
import { DBConfig } from "../config_map";
import { List } from "immutable";
import { destructure_table_name } from "../utils/conversion";

/**
 * Creates a table in the schema namespace and runs the trigger functions 
 * @param client 
 * @param db_config 
 */
export async function initialize_table(client: PoolClient, db_config: DBConfig): Promise<DBConfig> {
  // check if schema -> namespace exists
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${db_config.namespace};`, []);
  await client.query(`SET SCHEMA '${db_config.namespace}';`, []);
  await client.query(`SET search_path TO ${db_config.namespace};`, []);
  await client.query(`SELECT set_config('search_path', '${db_config.namespace}', false);`, []);
  await client.query(db_config.create_stmt, []);
  await Promise.all(db_config.trigger_stmt.map(sql => client.query(sql, [])));
  if (db_config.description && db_config.description?.table)
    await client.query(`COMMENT ON TABLE ${db_config.table_name} IS '${db_config.description.table}';`, []);
  if (db_config.description && db_config.description?.columns)
    for (const key in db_config.description.columns)
      await client.query(`COMMENT ON COLUMN ${db_config.table_name}.${key} IS '${db_config.description.columns[key]}';`, []);

  // AUTO INDEX EVERY FOREIGN KEY
  await Promise.all(
    await client.query(
      `SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
           AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='${db_config.table_name}' 
        AND tc.table_schema='${db_config.namespace}';`
    ).then(x  => x.rows.map(
      (r: {
        table_schema: string,
        constraint_name: string,
        table_name: string,
        column_name: string,
        foreign_table_schema: string,
        foreign_table_name: string,
        foreign_column_name: string
      }) => r))
      .then(rows => rows.map(row => client.query(`CREATE INDEX IF NOT EXISTS ${row.table_name}_${row.column_name}_fkey_idx ON ${row.table_schema}.${row.table_name}(${row.column_name});`, [])))
  );
  
  // GRANT
  await client.query(`REVOKE ALL ON ${db_config.namespace}.${db_config.table_name} FROM sidekick_public, sidekick_user;`);
  if (db_config.grant_stmt)
    await Promise.all(db_config.grant_stmt.map(sql => client.query(sql, [])));

  // ROW LEVEL SECURITY
  //// REVOKE CURRENT POLICIES
  await client.query(`SELECT policyname FROM pg_catalog.pg_policies WHERE schemaname = $1 AND tablename = $2`,
    [db_config.namespace, db_config.table_name])
    .then(x => x.rows.map(row => row.policyname))
    .then((policy: string[]) => Promise.all(policy.map(p => client.query(`DROP POLICY IF EXISTS ${p} ON ${db_config.namespace}.${db_config.table_name};`))));
  //// ENFORCE NEW POLICIES
  if (db_config.policy_stmt) {
    await client.query(`ALTER TABLE ${db_config.table_name} ENABLE ROW LEVEL SECURITY;`, []);
    await Promise.all(db_config.policy_stmt.map(sql => client.query(sql, [])));
  } else {
    await client.query(`ALTER TABLE ${db_config.table_name} DISABLE ROW LEVEL SECURITY;`, []);
  }
  return db_config;
}

/**
 * Returns an index of the element in sorted which depends on db_config.
 * Returns -1 if no element is depending on db_config.config.
 * 
 * Pure function
 * @param sorted immutable List of DBConfig
 * @param db_config must not be included in the sorted List
 */
export function element_depends_on_db_config(sorted: List<DBConfig>, db_config: DBConfig): number {
  let n = -1;
  sorted.map((x, i) => {
    let index_found = x.depends_on.map(d => destructure_table_name(d, x.namespace)).findIndex(v => {
      return v.table_name === db_config.table_name && v.namespace === db_config.namespace;
    });
    if (index_found >= 0) return i;
    else return -1;
  }
  ).forEach(v => {
    if (v >= 0 && v >= 0) {
      if (n >= 0 && n > v) {
        n = v;
      } else if (n < 0)
        n = v;
    }
  });
  return n;
}

/**
 * Returns an index of the element in sorted which is depended by db_config.
 * Returns -1 if no element is depending on db_config.config.
 * 
 * Pure function
 * @param sorted immutable List of DBConfig
 * @param db_config must not be included in the sorted List
 */
export function db_config_depends_on_elements(sorted: List<DBConfig>, db_config: DBConfig): number {
  let dependencies = db_config.depends_on.map(x => destructure_table_name(x, db_config.namespace));
  return sorted.findIndex(v =>
    dependencies.some(d => (d.table_name === v.table_name) && (d.namespace === v.namespace))
  );
}

/**
 * Returns an array in the right order to create the tables
 * @param configs 
 */
export function sort_db_config(configs: DBConfig[]): List<DBConfig> {
  let sorted: List<DBConfig> = List();
  configs.forEach(db_config => {
    let i = element_depends_on_db_config(sorted, db_config);
    let j = db_config_depends_on_elements(sorted, db_config);
    // thows if there is a cyclic dependency
    if (i >= 0 && j >= 0) throw new Error("Cyclic depenendcy found.");
    else if (i > j) sorted = sorted.insert(i, db_config);
    else if (j >= 0) sorted = sorted.insert(i - 1, db_config);
    else sorted = sorted.push(db_config);
  })

  return sorted;
}

export async function initialize_tables(client: PoolClient) {
  try {
    await client.query('BEGIN');
    await client.query(`SET ROLE 'sidekick_admin';`, []);
    let db_configs = sort_db_config(
      getFileFromDir("./src/database/tables", [], "\.yaml$")
        .map(filename => yaml_to_db_config(readFileSync(filename, "utf8")))
    );
    console.log(`Initialize table order: ${db_configs.map(x => x.table_name).toArray()}`)
    for(let i = 0; i < db_configs.count(); i++) {
      await initialize_table(client, db_configs.get(i) as DBConfig)
            .catch(err => console.log(`Error while initializing table 
                                      ${(db_configs.get(i) as DBConfig).table_name}
                                      .
                                      ${(db_configs.get(i) as DBConfig).table_name}, ${err}`));
    }

    await client.query(`SET ROLE 'sidekick_api';`, []);
    await client.query('COMMIT;');
  } catch (e) {
    await client.query('ROLLBACK;');
    throw e
  } finally {
    client.release();
  }
}