import redis from 'redis'
import jsonify from 'redis-jsonify'
import { promisify } from 'util'
export default class Redis {
  redis = redis.createClient()
  redisJson = jsonify(this.redis)

  set = promisify(this.redisJson.set).bind(this.redis)
  hset = promisify(this.redisJson.hset).bind(this.redis)

  get = promisify(this.redisJson.get).bind(this.redis)
  hget = this.redis.hGet
  hgetall = this.redis.hGetAll

  hdel = this.redis.hDel
  del = this.redis.del

  getAllKeys = () => this.redis.keys('*')
  flatten = (data: any) => JSON.stringify(data)

  unflatten = (data: any) => {
    try {
      data = JSON.parse(data)
      return data
    } catch (e) {
      console.error(e, data)
    }
  }
  init = () => {}
}
