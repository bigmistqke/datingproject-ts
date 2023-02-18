import { Db, Filter, MongoClient } from 'mongodb'
import type { Collection, Document } from 'mongodb'

export default class Mongo {
  db: Db
  client: MongoClient

  constructor({ url }) {
    this.client = new MongoClient(url, {})
  }

  connect = async (dbName: string) => {
    try {
      await this.client.connect()
      this.db = this.client.db(dbName)
    } catch (err) {
      console.error('error while connecting to mongodb', err)
    }
  }

  close = () => this.client.close()

  getCollection = (collection_name: string) => new MongoCollection(this.db, collection_name)
}

class MongoCollection {
  collection: Collection<Document>

  constructor(db: Db, collection_name: string) {
    if (!db) {
      console.error('db is not defined !')
      return
    }
    this.collection = db.collection(collection_name)
  }

  findDocument = (query: Filter<Document>) => this.collection.findOne(query)

  deleteDocument = (query: Filter<Document>) => this.collection.deleteOne(query)

  updateDocument = (query: Filter<Document>, content: Document) =>
    this.collection.updateOne(query, { $set: content }, { upsert: true })

  replaceDocument = (query: Filter<Document>, content: Document) =>
    this.collection.replaceOne(query, content, { upsert: true })

  pushDocument = (query: Filter<Document>, content: Document) =>
    this.collection.updateOne(query, { $push: content }, { upsert: true })

  insertDocument = (content: Document) => this.collection.insertOne(content)

  dump = () => this.collection.find().toArray()
}
