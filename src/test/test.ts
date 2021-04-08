import { assert } from "console";
import {run as dynamic_middleware_tests} from "./dynamic_middleware";
import {run as utils_files_tests} from "./utils/files";

function test1() {
  assert(1===1, 'Simple test fails 1===1');
}


function run(){
  console.log("Running tests");
  test1();
  dynamic_middleware_tests();
  utils_files_tests();
}

run();