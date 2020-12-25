import chai from "chai";
import {yaml_to_db_config} from "../../src/utils/yaml";
import {getFileFromDir} from "../../src/utils/files";
import {readFileSync} from "fs";

chai.should();

function shrink_text(text: string):string {
  return text.trim().replace(/\n/gi, '').replace( /\s{2,}/gi, ' ');
}

function shrink_db_config(db_config:any) {
  if(db_config.doc) db_config.doc = shrink_text(db_config.doc);
  if(db_config.create_stmt) db_config.create_stmt = shrink_text(db_config.create_stmt);
  if(db_config.description.table) db_config.description.table = shrink_text(db_config.description.table);
}

describe("Parse Yaml", () => {
  it("User database config", () => {
    let yaml_path = getFileFromDir("src/database/tables/users", [], "yaml")[0];
    let yaml_str = readFileSync(yaml_path, "utf8");
    let db_config = yaml_to_db_config(yaml_str)
    shrink_db_config(db_config);
    db_config
    .should.eql({
      namespace: "sidekickjs",
      type: "DBConfig",
      doc: "Base User Identity. If the user is **blocked** no REST or GraphQL actions can be performed. User concept will be extended by other tables. Usually going by the nameing convention users__<decoration> with references via users__id",
      table_name: "users",
      depends_on: [],
      create_stmt: "CREATE TABLE IF NOT EXISTS users ( id SERIAL PRIMARY KEY, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW(), blocked BOOLEAN NOT NULL DEFAULT FALSE );",
      trigger_stmt: [],
      description: {
        table: "Base User Identity. If the user is **blocked** no REST or GraphQL actions can be performed. User concept will be extended by other tables. Usually going by the nameing convention users__<decoration> with references via users__id",
        columns: {
          id: "Auto incremental integer",
          created_at: "Timestamp when the user was created",
          updated_at: "Timestamp when the last modification has happend",
          blocked: "Boolean"
        }
      }
    });
  })
})
