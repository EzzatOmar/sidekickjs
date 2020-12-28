import {query, getClient} from "./database/core";
import {PoolClient} from "pg";
import {getFileFromDir} from "./utils/files";
import {parse} from "./utils/yaml";
import {readFileSync} from "fs";
import {ExtensionConfig, DBConfig} from "./config_map";
import {initialize_table} from "./database/init"

/**
 * Creates a row in extension and a new schema for this extension
 * @param client 
 * @param extension 
 */
async function upsert_extension(client: PoolClient, extension : ExtensionConfig) {
  client.query
}

export async function initialize_extensions(client: PoolClient) {
  try {
    console.log('FFF')
    await client.query('BEGIN');
    await client.query(`SET ROLE 'sidekick_api';`, []);
    let promises = getFileFromDir("./src/extensions", [], "\.yaml$").map(filename=>{
      let config = parse(readFileSync(filename, "utf8"));
      // switch (config.type) {
      //   case "DBConfig":
      //     return initialize_table(client, config as DBConfig);
      //   case "ExtensionConfig":
      //     // TODO
      //     break;
      
      //   default:
      //     break;
      // }
      console.log(config);
      // return initialize_table(client, db_config)
      // .then(db_config => console.log(`Table ${db_config.table_name} created.`))
      // .catch(err => console.log(err.message));
    });
    // await Promise.all(promises);
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