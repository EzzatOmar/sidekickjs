import {PoolClient} from "pg";
import {getFileFromDir} from "../utils/files";
import {yaml_to_db_config} from "../utils/yaml";
import {readFileSync} from "fs";
import {DBConfig} from "../config_map";
import {List} from "immutable";
import {destructure_table_name} from "../utils/conversion";

/**
 * Creates a table in the schema namespace and runs the trigger functions 
 * @param client 
 * @param db_config 
 */
export async function initialize_table (client:PoolClient, db_config:DBConfig):Promise<DBConfig> {
  // check if schema -> namespace exists
  await client.query( `CREATE SCHEMA IF NOT EXISTS ${db_config.namespace};`, [] );
  await client.query( `SET SCHEMA '${db_config.namespace}';`, [] );
  await client.query(db_config.create_stmt, []);
  await Promise.all(db_config.trigger_stmt.map(sql => client.query(sql, [])));
  if(db_config.description && db_config.description?.table)
    await client.query( `COMMENT ON TABLE ${db_config.table_name} IS '${db_config.description.table}';`, [] );
  if(db_config.description && db_config.description?.columns)
    for(const key in db_config.description.columns)
      await client.query( `COMMENT ON COLUMN ${db_config.table_name}.${key} IS '${db_config.description.columns[key]}';`, [] );
      
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
export function element_depends_on_db_config(sorted:List<DBConfig>, db_config:DBConfig) : number{
  console.log(sorted.map(x => x.namespace + "." + x.table_name).toArray(), db_config.namespace + "." + db_config.table_name);
  let n = -1;
  sorted.map((x,i) => {
    let index_found = x.depends_on.map(d => destructure_table_name(d, x.namespace)).findIndex(v => {
      return v.table_name === db_config.table_name && v.namespace === db_config.namespace;
    });
    if(index_found >= 0) return i;
    else return -1;
  }
  ).forEach(v => {
    if (v && v >= 0){
      if(n >= 0 && n > v) {
        n = v;
      } else if(n < 0)
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
export function db_config_depends_on_elements(sorted:List<DBConfig>, db_config:DBConfig) :number {
  let dependencies  = db_config.depends_on.map(x => destructure_table_name(x, db_config.namespace));
  return sorted.findIndex(v =>
       dependencies.some(d => (d.table_name === v.table_name) && (d.namespace === v.namespace))
  );
}

/**
 * Returns an array in the right order to create the tables
 * @param configs 
 */
export function sort_db_config(configs: DBConfig[]):List<DBConfig> {
  let sorted :List<DBConfig> = List();
  configs.forEach(db_config => {
    console.log(
      db_config.namespace + "." + db_config.table_name,
      sorted.map(x => x.namespace + '.' + x.table_name).toArray()

    )
    let i = element_depends_on_db_config(sorted, db_config);
    let j = db_config_depends_on_elements(sorted, db_config);
    console.log(i, j)
    // thows if there is a cyclic dependency
    if (i >= 0 && j >= 0) throw new Error("Cyclic depenendcy found.");
    else if (i >= 0) sorted = sorted.insert(i, db_config);
    else if (j >= 0) sorted = sorted.insert(i+1, db_config);
    else sorted = sorted.push(db_config);
  })

  return sorted;
}

export async function initialize_tables(client: PoolClient) {
  try {
    await client.query('BEGIN');
    await client.query(`SET ROLE 'sidekick_admin';`, []);
    let promises = getFileFromDir("./src/database/tables", [], "\.yaml$").map(filename=>{
      return yaml_to_db_config(readFileSync(filename, "utf8"));
      // return initialize_table(client, db_config)
      // .then(db_config => console.log(`Table ${db_config.table_name} created.`))
      // .catch(err => console.log(err.message));
    });
    // await Promise.all(promises);
    await client.query(`SET ROLE 'sidekick_api';`, []);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e
  } finally {
    client.release();
  }
}