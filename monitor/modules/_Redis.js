const flat = require('flat');
var unflatten = require('flat').unflatten;
const redis = require("redis");
const jsonify = require('redis-jsonify')
const promisify = require('util').promisify;

const _Redis = function () {
    const _redis = redis.createClient();
    const j_redis = jsonify(_redis);

    _redis.on("error", function (error) {
        console.error(error);
    });

    this.get = promisify(j_redis.get).bind(_redis);
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
    this.flatten = (data) => flat(data, { safe: true })

    this.unflatten = (data) => unflatten(data, { safe: true })
    this.init = () => { }
}

module.exports = _Redis