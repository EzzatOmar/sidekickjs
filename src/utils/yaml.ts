import {DBConfig, ConfigMap, ExtensionConfig, RoleConfig} from "../config_map";
import YAML from "yaml"
import {Set} from "immutable";

const types = Set(["DBConfig", "RouteConfig", "HandlerConfig", "MiddlewareConfig", "ExtensionConfig", "RoleConfig"]);

function yaml_to_ConfigMap(yaml: string): ConfigMap {
  let config_map = YAML.parse(yaml);
  if(!((!!config_map) && (config_map.constructor === Object))) {
    throw new Error('File is not an Object');
  }
  if(!(config_map.type && types.has(config_map.type))) {
    throw new Error('Invalid type: ' + config_map.type);
  }
  if(!config_map.namespace) {
    throw new Error('Namespace is missing');
  }
  return config_map as ConfigMap;
}

/**
 * Returns a DBConfig
 * 
 * Pure function
 * @param yaml Yaml string, should be read from a file before
 * 
 * TODO: Improve internal validation
 */
export function yaml_to_db_config(yaml: string):DBConfig {
  let db_config = yaml_to_ConfigMap(yaml) as DBConfig;
  if(db_config.description && db_config.description.table)
    db_config.doc = db_config.description.table;
  if(db_config.type !== "DBConfig") {
      throw new Error('Invalid type: must be DBConfig. Type found: ' + db_config.type);
    }
  return db_config;
}

/**
 * Returns a ExtensionConfig
 * 
 * Pure function
 * @param yaml Yaml string, should be read from a file before
 * 
 * TODO: Improve internal validation
 */
export function yaml_to_extension_config(yaml: string):ExtensionConfig {
  let config = yaml_to_ConfigMap(yaml) as ExtensionConfig;
  if(config.type !== "ExtensionConfig") {
      throw new Error('Invalid type: must be ExtensionConfig. Type found: ' + config.type);
    }
  return config;
}

/**
 * Returns a RoleConfig
 * 
 * Pure function
 * @param yaml Yaml string, should be read from a file before
 * 
 * TODO: Improve internal validation
 */
export function yaml_to_role_config(yaml: string):RoleConfig {
  let config = yaml_to_ConfigMap(yaml) as RoleConfig;
  if(config.type !== "RoleConfig") {
      throw new Error('Invalid type: must be RoleConfig. Type found: ' + config.type);
    }
  return config;
}

/**
 * Returns either an ExtensionConfig, DBConfig, HandlerConfig, MiddlewareConfig, RouteConfig, RoleConfig
 * 
 * Pure function
 * @param yaml Yaml string, should be read from a file before
 * 
 * TODO: Improve internal validation
 */
export function parse(yaml: string):ExtensionConfig | DBConfig | RoleConfig {
  let config = yaml_to_ConfigMap(yaml) as ExtensionConfig;
  switch (config.type) {
    case "DBConfig":
      return yaml_to_db_config(yaml);
    case "ExtensionConfig":
      return yaml_to_extension_config(yaml);
    case "RoleConfig":
      return yaml_to_role_config(yaml);
    default:
      throw new Error('Invalid type: must be ExtensionConfig.');
  }
}
