import assert from "assert";
import rewire from "rewire";

let tests = [
    {regex: undefined, expected_output: [
        'dist/test/utils/testFiles/a.js',
        'dist/test/utils/testFiles/b.js',
        'dist/test/utils/testFiles/c.js',
        'dist/test/utils/testFiles/bar/hello.a.js',
        'dist/test/utils/testFiles/bar/hello.c.js',
        'dist/test/utils/testFiles/foo/hello.a.js',
        'dist/test/utils/testFiles/foo/hello.b.js',
    ]},
    {regex: "hello", expected_output: [
        'dist/test/utils/testFiles/bar/hello.a.js',
        'dist/test/utils/testFiles/bar/hello.c.js',
        'dist/test/utils/testFiles/foo/hello.a.js',
        'dist/test/utils/testFiles/foo/hello.b.js',
    ]},
    {regex: "hwow", expected_output: [
    ]},
        {regex: "hwow", expected_output: [
    ]},
    {regex: "test", expected_output: [
    ]},
    {regex: "bar", expected_output: [
        'dist/test/utils/testFiles/bar/hello.a.js',
        'dist/test/utils/testFiles/bar/hello.c.js',
     ]},
     {regex: "^bar", expected_output: [
        'dist/test/utils/testFiles/bar/hello.a.js',
        'dist/test/utils/testFiles/bar/hello.c.js',
     ]},
    {regex: "b", expected_output: [
        'dist/test/utils/testFiles/b.js',
        'dist/test/utils/testFiles/bar/hello.a.js',
        'dist/test/utils/testFiles/bar/hello.c.js',
        'dist/test/utils/testFiles/foo/hello.b.js',
    ]},
    {regex: "^b", expected_output: [
        'dist/test/utils/testFiles/b.js',
        'dist/test/utils/testFiles/bar/hello.a.js',
        'dist/test/utils/testFiles/bar/hello.c.js',
    ]},
];

function getFileFromDir_test(){
    const utilsFiles = rewire('../../utils/files.js');
    let getFileFromDir:(dirPath: string, arrayOfFiles: string [], regex?: string) => any = utilsFiles.__get__('getFileFromDir');
    tests.forEach(({regex, expected_output}) => {
        let output = getFileFromDir('./dist/test/utils/testFiles', [], regex);
        let a = new Set(expected_output);
        let b = new Set(output);
        assert.deepStrictEqual(a,b , `getFileFromDir failed: input: ${regex}, output: ${JSON.stringify(output)}, expected: ${JSON.stringify(expected_output)}`)
    })
}

export function run() {
    try {
        getFileFromDir_test();

    } catch (e) {
        console.log(e);
    }
}