import { unflatten } from 'flat'
import { Design } from '../../types'
import Mongo from '../wrappers/Mongo'
import Redis from '../wrappers/Redis'

export default class Database {
  mongo: Mongo
  redis: Redis

  constructor({ mongo, redis }) {
    this.mongo = mongo
    this.redis = redis
  }

  // SCRIPT

  saveScript = async ({ script_id, script }) =>
    await this.mongo.getCollection('scripts').updateDocument({ script_id }, script)

  getScript = async script_id => this.mongo.getCollection('scripts').findDocument({ script_id })

  deleteScript = async script_id =>
    this.mongo.getCollection('scripts').deleteDocument({ script_id })

  getAllScripts = async () => this.mongo.getCollection('scripts').dump()

  // CARD

  // TODO: set type design to something else then any
  saveDesign = async ({ design, design_id }: { design: any; design_id: string }) => {
    this.mongo
      .getCollection('cards')
      .updateDocument({ card_id: design_id }, { modified: new Date().getTime(), design })
  }

  getDesign = async ({ design_id }: { design_id: string }) => {
    // TODO: check cache
    let data = await this.mongo.getCollection('cards').findDocument({ card_id: design_id })
    if (!data) return false
    return data as any as { design: Design; modified: number }
  }

  getAllDesigns = async () => this.mongo.getCollection('cards')

  // STATS

  saveStats = async ({
    room_id,
    role_id,
    stats,
  }: {
    room_id: string
    role_id: string
    stats: any[]
  }) => {
    try {
      this.mongo.getCollection('stats').pushDocument({ room_id }, { [role_id]: stats })
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  initStats = async ({
    room_id,
    script_id,
    role_ids,
  }: {
    room_id: string
    script_id: string
    role_ids: string[]
  }) => {
    if (!role_ids) {
      console.error('role_ids are undefined while trying to initStats')
      return
    }
    this.mongo.getCollection('stats').updateDocument(
      { room_id },
      {
        room_id,
        script_id,
        ...Object.fromEntries(role_ids.map(id => [id, []])),
      },
    )
  }
}
