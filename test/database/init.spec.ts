import {sort_db_config, db_config_depends_on_elements, element_depends_on_db_config} from "../../src/database/init";
import {destructure_table_name} from "../../src/utils/conversion";
import {DBConfig} from "../../src/config_map";
import chai from "chai";
import {List} from "immutable";
import { doesNotReject } from "assert";

chai.should();
const expect = chai.expect;

const db_root :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_root",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: []
};

const db_a :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_a",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_root"]
};

const db_b :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_b",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_root"]
};

const db_a_a :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_a_a",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_a"]
};

const db_a_b :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_a_b",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_a"]
};

const db_a2 :DBConfig = {
  create_stmt: "",
  namespace: "bar",
  table_name: "db_a",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["foo.db_root"]
};

const db_a_a2 :DBConfig = {
  create_stmt: "",
  namespace: "bar",
  table_name: "db_a_a",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["bar.db_a"]
};

const db_root2 :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_root2",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: []
};

const db_cycle1 :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_cycle1",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_cycle22"]
};

const db_cycle11 :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_cycle11",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_cycle1"]
};

const db_cycle2 :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_cycle2",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_cycle11"]
};

const db_cycle22 :DBConfig = {
  create_stmt: "",
  namespace: "foo",
  table_name: "db_cycle22",
  trigger_stmt: [],
  type: "DBConfig",
  depends_on: ["db_cycle2"]
};

describe("Test db_config_depends_on_elements", () => {
  it("Return the correct index", () => {
    let l = List([db_root, db_a, db_b]);
    expect(db_config_depends_on_elements(l, db_a_a)).to.be.equal(1);

    let l2 = List([db_root, db_a2 , db_a, db_b]);
    expect(db_config_depends_on_elements(l2, db_a_a)).to.be.equal(2);

    let l3 = List([db_root, db_b]);
    expect(db_config_depends_on_elements(l3, db_a)).to.be.equal(0);

    let l4 = List([db_root, db_b, db_a]);
    expect(db_config_depends_on_elements(l4, db_a_a2)).to.be.equal(-1);

    let l5 = List([db_root, db_b, db_a2]);
    expect(db_config_depends_on_elements(l5, db_a_a2)).to.be.equal(2);
  });
});

describe("Test element_depends_on_db_config", () => {
  it("Return the correct index", () => {
    let l = List([db_root, db_a, db_b]);
    expect(element_depends_on_db_config(l, db_a_a)).to.be.equal(-1);

    let l2 = List([db_root, db_a2 , db_a, db_b]);
    expect(element_depends_on_db_config(l2, db_a_a)).to.be.equal(-1);

    let l3 = List([db_root, db_b, db_a_a]);
    expect(element_depends_on_db_config(l3, db_a)).to.be.equal(2);

    let l4 = List([db_root, db_b, db_a, db_a_a2]);
    expect(element_depends_on_db_config(l4, db_a2)).to.be.equal(3);

    let l5 = List([db_a_a]);
    expect(element_depends_on_db_config(l5, db_a)).to.be.equal(0);
  });
});

describe("Test if reordering works", () => {
  it("Reorder: good case", () => {
    const configs = [db_a_a, db_a, db_root2, db_b, db_root, db_b];
    const sorted = sort_db_config(configs);
    chai.assert.isTrue(
      sorted.every((v,k)=>{
        const listAfterEl = sorted.slice(k+1);
        // we need to check if no depends_on table_name is in listAfterEl
        return v.depends_on.every(table_name => {
          const t = destructure_table_name(table_name);
          // no dependency should appear after the current DBConfig
            return listAfterEl.every(v2 => !(v2.table_name === t.table_name && v2.namespace === (t.namespace || v.namespace)) );
          });
        })
    );
  })

  it("Reorder: good case with 2 namespaces and same table name", () => {

  })

  it("Reorder: bad case with cyclic dependencies", (done) => {
    try {
      const configs = [db_a_a, db_a, db_root2, db_b, db_root, db_b, db_cycle2, db_cycle1, db_cycle22, db_cycle11];
      const sorted = sort_db_config(configs);
    } catch(err) {
      done();
    }
  })
})