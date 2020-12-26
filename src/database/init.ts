import {Pool, PoolClient, QueryResult} from "pg";
import {getFileFromDir} from "../utils/files";
import {yaml_to_db_config} from "../utils/yaml";
import {readFileSync} from "fs";
import {DBConfig} from "../config_map";

/**
 * Creates a table in the schema namespace and runs the trigger functions 
 * @param client 
 * @param db_config 
 */
async function initialize_table (client:PoolClient, db_config:DBConfig):Promise<DBConfig> {
  // check if schema -> namespace exists
  await client.query( `CREATE SCHEMA IF NOT EXISTS ${db_config.namespace};`, [] );
  await client.query( `SET SCHEMA '${db_config.namespace}';`, [] );
  await client.query(db_config.create_stmt, []);
  await Promise.all(db_config.trigger_stmt.map(sql => client.query(sql, [])));
  return db_config;
}

export async function initialize_tables(client: PoolClient) {
  try {
    await client.query('BEGIN');
    await client.query(`SET ROLE 'sidekick_admin';`, []);
    let promises = getFileFromDir("./src/database/tables", [], "\.yaml$").map(filename=>{
      let db_config = yaml_to_db_config(readFileSync(filename, "utf8"));
      return initialize_table(client, db_config).then(db_config => console.log(`Table ${db_config.table_name} created.`));
    });
    await Promise.all(promises);
    client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release();
  }

  return 12;
}