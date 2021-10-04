/* const flat = require('flat');
var unflatten = require('flat').unflatten; */
const redis = require("redis");
const jsonify = require('redis-jsonify')
const promisify = require('util').promisify;

const { flatten, unflatten } = require('safe-flat');

const _Redis = function () {
    const _redis = redis.createClient();
    const j_redis = jsonify(_redis);

    _redis.on("error", function (error) {
        console.error(error);
    });

    this.get = promisify(_redis.get).bind(_redis);
    this.set = promisify(j_redis.set).bind(_redis);
    this.hset = promisify(j_redis.hset).bind(_redis);

    this.hmset = promisify(_redis.hmset).bind(_redis);
    this.hget = promisify(_redis.hget).bind(_redis);
    this.hgetall = promisify(_redis.hgetall).bind(_redis);

    this.hdel = promisify(_redis.hdel).bind(_redis);
    this.del = promisify(_redis.del).bind(_redis);

    this.getAllKeys = () => {
        return new Promise((resolve) => {
            _redis.keys('*', function (err, keys) {
                if (err) resolve(err);
                resolve(keys);
            });
        })
    }
    this.flatten = (data) => JSON.stringify(data)

    this.unflatten = (data) => {
        try {
            data = JSON.parse(data);
            return data;
        } catch (e) {
            console.error(e, data);

        }
        // return JSON.parse(data)
    }
    this.init = () => { }
}

module.exports = _Redis