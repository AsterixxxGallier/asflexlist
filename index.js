const AsBind = require("as-bind/dist/as-bind.cjs.js");
const fs = require("fs");

const wasm = fs.readFileSync("./build/untouched.wasm");

const asyncTask = async () => {
    // function log(message) {
    //     console.log(asBindInstance.exports.__getString())
    // }

    const asBindInstance = await AsBind.instantiate(wasm, {
        index: {
            log: message => console.log(message)
        }
    });

    with (asBindInstance.exports) {
        init()
    }
};
// noinspection JSIgnoredPromiseFromCall
asyncTask();