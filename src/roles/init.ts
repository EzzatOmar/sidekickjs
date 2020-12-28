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
  client.query(`
  DO
    $do$
    BEGIN
      IF NOT EXISTS (
          SELECT FROM pg_catalog.pg_roles  -- SELECT list can be empty for this
          WHERE  rolname = '${role_config.role_name}') THEN

          CREATE ROLE ${role_config.role_name} ;
      END IF;
    END
    $do$;
  `);

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

    console.log(`Roles found: ${roles.map(x => x.role_name)}`)
    
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