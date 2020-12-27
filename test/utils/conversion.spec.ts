import chai from "chai";
import {destructure_table_name} from "../../src/utils/conversion"; 

chai.should();

describe("Table name destructuring", () => {
  it("good cases", () => {
    destructure_table_name("a")
    .should.eql({table_name: "a"});

    destructure_table_name("fo")
    .should.eql({table_name: "fo"});

    destructure_table_name("hello.one")
    .should.eql({table_name: "one", namespace: "hello"});

    destructure_table_name("hello.test_1")
    .should.eql({table_name: "test_1", namespace: "hello"});

    console.log(
      "sdf.sdf".split(".")
      
      )
  });

});