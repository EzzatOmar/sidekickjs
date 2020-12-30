import {PoolClient} from "pg";
import {getFileFromDir} from "./utils/files";
import {parse} from "./utils/yaml";
import {readFileSync} from "fs";
import {ExtensionConfig, DBConfig} from "./config_map";
import {initialize_table, sort_db_config} from "./database/init"

/**
 * Creates a row in extensions and a new schema for this extension. Creates all postgres functions inside the schema namespace
 * if provided
 * 
 * @param client 
 * @param extension 
 */
async function upsert_extension(client: PoolClient, extension : ExtensionConfig) {
  await client.query( `CREATE SCHEMA IF NOT EXISTS ${extension.namespace};`, [] );
  await client.query( `GRANT USAGE ON SCHEMA ${extension.namespace} TO ${extension.roles};`)
  
  await client.query(`
  INSERT INTO sidekick.extensions (namespace, version, url, doc,  state)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (namespace)
  DO
    UPDATE SET version = $2, url = $3, doc = $4;
  `, [extension.namespace, extension.version, extension.url, extension.doc, extension.default_state]);

  await client.query( `SET SCHEMA '${extension.namespace}';`, [] );
  if (!!extension.create_functions) {
    await client.query(`ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;`, []);
    for(let i = 0; i < extension.create_functions.length; i++) {
      await client.query( extension.create_functions[i], [] );
    }
  }

  await client.query( `SET SCHEMA 'sidekick';`, [] );
}

export async function initialize_extensions(client: PoolClient) {
  try {
    await client.query('BEGIN');
    await client.query(`SET ROLE 'sidekick_admin';`, []);
    let configs = getFileFromDir("./src/extensions", [], "\.yaml$")
                  .map(filename=> parse(readFileSync(filename, "utf8")));
    let db_configs = configs.filter(x => x.type === 'DBConfig') as DBConfig[];
    let extensions = configs.filter(x => x.type === 'ExtensionConfig') as ExtensionConfig[];

    console.log(`Extensions found: ${extensions.map(x => x.namespace)}`)
    console.log(`Extension tables found: ${db_configs.map(x => x.namespace + "." + x.table_name)}`)
    
    await Promise.all(extensions.map(x => upsert_extension(client, x)));
    await Promise.all(
      sort_db_config(db_configs).map(x => 
        initialize_table(client, x)
        .catch(err => console.log(`Error while initializing table ${x.table_name}, ${err}`))).toArray()
      );
    await client.query(`SET ROLE 'sidekick_api';`, []);

    // await client.query(`SET ROLE 'sidekick_api';`, []);
    client.query('COMMIT');
    await client.query(`SET ROLE 'sidekick_api';`, []);
    
  } catch (e) {
    await client.query('ROLLBACK');
  throw e
  } finally {
    client.release();
  }
}