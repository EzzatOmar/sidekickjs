import {DBConfig} from "../config_map";
import YAML from "yaml"

export function yaml_to_db_config(yaml: string):DBConfig {
  let db_config = YAML.parse(yaml);
  if(db_config.description && db_config.description.table)
    db_config.doc = db_config.description.table;
  return db_config as DBConfig;
}