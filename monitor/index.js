const _Redis = require("./modules/_Redis.js");
const _Mqtt = require("./modules/_Mqtt.js");


let _redis = new _Redis();
let _mqtt = new _Mqtt();

let init = async () => {
    _redis.init();
    _redis.subscribe('createRoom', (pattern, channel, message) => {
        console.log(message);
    })
}


init();

