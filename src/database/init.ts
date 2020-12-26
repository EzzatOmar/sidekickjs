import {Pool, PoolClient, QueryResult} from "pg";
import {getFileFromDir} from "../utils/files";
import {yaml_to_db_config} from "../utils/yaml";
import {readFileSync} from "fs";

export async function initialize_tables(client: PoolClient) {
  getFileFromDir("./src/database/tables", [], "\.yaml$").forEach(filename=>{
    console.log(yaml_to_db_config(readFileSync(filename, "utf8")))
      
  })
  return 12;
}