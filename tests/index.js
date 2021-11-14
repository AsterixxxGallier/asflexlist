// noinspection EqualityComparisonWithCoercionJS

// const assert = require("assert");

// const ConsoleImport = require('as-console/imports')
// const Console = new ConsoleImport()

const AsBind = require("as-bind/dist/as-bind.cjs.js");
const fs = require("fs");

const wasm = fs.readFileSync("./build/untouched.wasm");

const asyncTask = async () => {
    // Instantiate the wasm file, and pass in our importObject
    const asBindInstance = await AsBind.instantiate(wasm, {
        // ...Console.wasmImports
        test: {
            log: message => console.log(message)
        }
    });

    with (asBindInstance.exports) {
        runTests()
    }
};
// noinspection JSIgnoredPromiseFromCall
asyncTask();

