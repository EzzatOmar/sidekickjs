import {PoolClient} from "pg";
import {getFileFromDir} from "../utils/files";
import {parse} from "../utils/yaml";
import {readFileSync} from "fs";
import {RoleConfig} from "../config_map";

/**
 * Creates a new postgres role
 * @param client 
 * @param role_config 
 */
export async function create_role(client: PoolClient, role_config: RoleConfig) {
  console.log(role_config)
  client.query(`CREATE ROLE ${role_config.role_name};`);
  if(!!role_config.doc)
    client.query(`COMMENT ON ROLE ${role_config.role_name} IS '${role_config.doc}'`);
}

export async function init_roles(client: PoolClient) {
  try {
    await client.query('BEGIN');
    await client.query(`SET ROLE 'sidekick_admin';`, []);
    let configs = getFileFromDir("./src/roles", [], "\.yaml$")
                  .map(filename=> parse(readFileSync(filename, "utf8")));
    let roles = configs.filter(x => x.type === 'RoleConfig') as RoleConfig[];

    // console.log(`Extensions found: ${extensions.map(x => x.namespace)}`)
    
    await Promise.all(roles.map(x => create_role(client, x)));

    client.query('COMMIT');
    await client.query(`SET ROLE 'sidekick_api';`, []);
    
  } catch (e) {
    await client.query('ROLLBACK');
  throw e
  } finally {
    client.release();
  }
}