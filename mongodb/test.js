const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const flat = require('flat');
var unflatten = require('flat').unflatten;
const redis = require("redis");
const jsonify = require('redis-jsonify')
const promisify = require('util').promisify;





const _Mongo = function (url) {
    const client = new MongoClient(url);
    let db;

    const _Collection = function (collection_name) {
        let collection = db.collection(collection_name);

        this.findDocument = async (query) => await collection.findOne(query)
        this.updateDocument = async (query, content) => await collection.updateOne(query, { $set: content })
        this.insertDocument = async (content) => await collection.insertOne(content)
    }

    this.connect = (dbName) => {
        return new Promise((resolve, reject) => {
            client.connect(function (err) {
                if (err != null) reject();
                db = client.db(dbName);
                resolve();
            });
        })
    }

    this.close = () => {
        client.close();
    }



    this.getCollection = (collection_name) => new _Collection(collection_name)


}

const _Redis = function () {
    const _redis = redis.createClient();
    const j_redis = jsonify(_redis);

    this._get = promisify(j_redis.get).bind(_redis);
    this._set = promisify(j_redis.set).bind(_redis);
    this._hmset = promisify(_redis.hmset).bind(_redis);
    this._hget = promisify(_redis.hget).bind(_redis);
    this._hdel = promisify(_redis.hdel).bind(_redis);
    this._del = promisify(_redis.del).bind(_redis);

    _redis.on("error", function (error) {
        console.error(error);
    });


    this.getAllKeys = () => {
        return new Promise((resolve) => {
            _redis.keys('*', function (err, keys) {
                if (err) resolve(err);
                resolve(keys);
            });
        })
    }
}

const DP_Redis = function () {
    _Redis.call(this);

    this.getContent = async (script_id) => {
        let data = {}
        let blocks = await this._get(`s_${script_id}_temp_blocks`);
        if (!blocks) {
            return false;
        }
        blocks = Object.values(unflatten(blocks));
        let instructions = await this._get(`s_${script_id}_temp_instructions`);
        instructions = unflatten(instructions);
        let roles = await this._get(`s_${script_id}_temp_roles`);
        roles = unflatten(roles);
        return { roles, blocks, instructions };
    }
}


const init = async () => {
    let _mongo = new _Mongo('mongodb://localhost:27017');
    let _redis = new DP_Redis();

    await _mongo.connect('datingProject');

    let keys = await _redis.getAllKeys();
    let script_keys = keys.filter(key => key.includes('_temp_instructions'))
        .map(key => key.replace('s_', '').replace('_temp_instructions', ''));

    let results = [];
    const _collection = _mongo.getCollection('scripts');
    for (let name of script_keys) {
        let content = await _redis.getContent(name);
        await _collection.findDocument({ name: name }) ?
            await _collection.insertDocument({ ...content, name }) :
            await _collection.updateDocument({ name: name }, { ...content, name })
    }

    _mongo.close();
}
init();