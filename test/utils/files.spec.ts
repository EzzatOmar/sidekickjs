import {strictEqual} from "assert";
import chai from "chai";
import {getFileFromDir} from "../../src/utils/files"; 

chai.should();


console.log(getFileFromDir("src/database/tables",[]));

describe("Test listing files recursively", () => {
  it("every file", () => {
    const files = getFileFromDir("src", []);
    files.should.be.instanceof(Array);
    files.join().should.include("src/database/tables/users/db.yaml")
    .and.include("src/index.ts");
  });
  it("only yaml files", () => {
    const files = getFileFromDir("src", [], ".yaml$");
    files.should.be.instanceof(Array);
    files.forEach(f => {
      f.should.match(new RegExp(".yaml$"));
    })

  })
  
})

