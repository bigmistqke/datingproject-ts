const MongoClient = require('mongodb').MongoClient;

// import { MongoClient } from 'mongodb';

const _Mongo = function ({ url }) {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    let db;



    const _Collection = function (collection_name) {
        if (!db) {
            console.error('db is not defined !');
            return;
        }
        let collection = db.collection(collection_name);

        this.findDocument = async (query) => await collection.findOne(query)
        this.updateDocument = async (query, content) => await collection.updateOne(query, { $set: content }, { upsert: true })
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
module.exports = _Mongo
// export default _Mongo