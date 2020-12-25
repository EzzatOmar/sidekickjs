import {DBConfig, ConfigMap} from "../config_map";
import YAML from "yaml"
import {Set} from "immutable";

const types = Set(["DBConfig", "RouteConfig", "HandlerConfig", "MiddlewareConfig", "ExtensionConfig"]);

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
  return db_config;
}