const Mqtt = require('./Mqtt.js');
const redis = require("redis");
const jsonify = require('redis-jsonify')
const promisify = require('util').promisify;
const flat = require('flat');
var unflatten = require('flat').unflatten;

let _mqtt, _redis;

_redis = redis.createClient();
const _get = promisify(_redis.get).bind(_redis);
const _set = promisify(_redis.set).bind(_redis);


const disconnect = async (json) => {

}

const createRoom = async (json) => {

}

const connect = async (json) => {
    console.log("TRYING TO CONNECT YO");
}

const init = async () => {
    _mqtt = await new Mqtt("localhost");
    _redis.on("error", function (error) {
        console.error(error);
    });
    _mqtt.subscribe('/connect', connect);
    _mqtt.subscribe('/disconnect', disconnect);
    _mqtt.subscribe('+', (e) => { console.log('swipe', e) })
}

init();

console.log('ok');
