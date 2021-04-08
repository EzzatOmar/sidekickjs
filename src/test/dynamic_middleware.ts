import assert from "assert";
import rewire from "rewire";

let args = [
    {path: "/", mockedFiles: [], category: {slash: true, extension: "html", filename: "index"}, searchResult: null},
    
    {path: "/", 
     mockedFiles: ["custom/dist/pages/index.html", "custom/dist/pages/test/index.html", "custom/dist/pages/hello/test/index.html"], 
     category: {
         slash: true,
         extension: "html",
         filename: "index"
     },
     searchResult: "custom/dist/pages/index.html"},
    
     {path: "/foo", 
     mockedFiles: ["custom/dist/pages/foo.html", "custom/dist/pages/foo.mw_cached.jpeg", "custom/dist/pages/foo.mw_cached.html"],
     category: {slash: false, extension: "html", filename: "foo"},
     searchResult: "custom/dist/pages/foo.mw_cached.html"},

     {path: "/foo.png", 
     mockedFiles: ["custom/dist/pages/foo.png"],
     category: {slash: false, extension: "png", filename: "foo"},
     searchResult: "custom/dist/pages/foo.png"},

     {path: "/foo.jpeg", 
     mockedFiles: ["custom/dist/pages/foo.mw_cached.jpeg"],
     category: {slash: false, extension: "jpeg", filename: "foo"},
     searchResult: "custom/dist/pages/foo.mw_cached.jpeg"},

     {path: "/test/foo", 
     mockedFiles: ["custom/dist/pages/test/foo.html", "custom/dist/pages/test/foo.mw_cached.html"],
     category: {slash: false, extension: "html", filename: "test/foo"},
     searchResult: "custom/dist/pages/test/foo.mw_cached.html"},

     {path: "/test/foo/", 
     mockedFiles: ["custom/dist/pages/test/foo.html", "custom/dist/pages/test/foo.mw_cached.html"],
     category: {slash: true, extension: "html", filename: "test/foo"},
     searchResult: "custom/dist/pages/test/foo.mw_cached.html"},

     {path: "/test/foo/", 
     mockedFiles: ["custom/dist/pages/foo.mw_cached.html", "custom/dist/pages/test/foo/index.html", "custom/dist/pages/test/foo.mw_cached.html"],
     category: {slash: true, extension: "html", filename: "test/foo"},
     searchResult: "custom/dist/pages/test/foo/index.html"},

     {path: "/test", 
     mockedFiles: ["custom/dist/pages/test/foo.html", "custom/dist/pages/test/index.html"],
     category: {slash: false, extension: "html", filename: "test"},
     searchResult: "custom/dist/pages/test/index.html"},
];

function test_pathToCategory() {
    const dyMw = rewire('../dynamic_middleware.js');
    let pathToCategory:(path:string) => any = dyMw.__get__('pathToCategory');

    args.forEach(({path, category}) => {
        let result = pathToCategory(path);
        assert.deepStrictEqual(result, category, `pathToCategory failed: input: ${path}, output: ${JSON.stringify(result)}, expected output: ${JSON.stringify(category)}`)
    })
}

function search_for_file_match_test() {
    const dyMw = rewire('../dynamic_middleware.js');
    let search_for_file_match = dyMw.__get__('search_for_file_match');

    args.forEach(({path, mockedFiles, searchResult}) => {
        dyMw.__set__(
            {
                getFiles: function(dirPath: string, regex?: string | undefined) {return mockedFiles;},
            }
        );
        let output = search_for_file_match(path, "custom/dist/pages");
        assert(searchResult === output, `search_for_file_match failed: input: ${path}, output: ${output}, expected output: ${searchResult}`);
    })


}


export function run() {
    try {
        test_pathToCategory();
        search_for_file_match_test();
    } catch (e) {
        console.log(e);
    }
}