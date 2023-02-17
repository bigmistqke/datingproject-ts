import { Instruction, Script } from '../../types'
import Mongo from '../wrappers/Mongo'
import Mqtt from '../wrappers/Mqtt'
import Redis from '../wrappers/Redis'

import crypto from 'crypto'
import { array_remove_element } from '../utils/pure-array'
import Q from 'qquuee'

// TODO: refactor to something less hacky
Object.prototype.filter = (obj, predicate) =>
  Object.keys(obj)
    .filter(key => predicate(key))
    .reduce((res, key) => ((res[key] = obj[key]), res), {})

type PlayerMeta = {
  status: 'uninitialized' | 'connected' | 'disconnected'
  instruction_index: 0
  instructions_length: number
  instruction: Instruction
  autoswipe: boolean
  role_id: string
  name: string
  last_interaction: number
}

type RoomMeta = {
  design_id: string
  players: Record<string, PlayerMeta>
  room_name: string
  game_count: number
  script_id: string
  count: number
  sound: string
}

export default class RoomManager {
  rooms = {}
  queue = new Q()

  redis: Redis
  mqtt: Mqtt
  mongo: Mongo

  constructor({ redis, mqtt, mongo }) {
    this.redis = redis
    this.mqtt = mqtt
    this.mongo = mongo
  }

  process = <T>(func: () => T) => this.queue.add(func)

  init = async () => {
    const room_ids = await this.getAllRoomIds()

    room_ids.forEach(room_id => {
      if (!this.rooms[room_id]) {
        this.rooms[room_id] = new Room({ redis: this.redis, mongo: this.mongo, mqtt: this.mqtt })
        this.rooms[room_id].setRoomId(room_id)
        this.rooms[room_id].monitor()
      }
    })
  }

  createRoom = async ({ script, script_id }) => {
    const new_room = new Room({ redis: this.redis, mongo: this.mongo, mqtt: this.mqtt })
    const { room_id, role_ids } = await new_room.create({ script, script_id })
    this.rooms[room_id] = new_room

    await this.process(async () => {
      let _rooms = await this.redis.get('rooms')

      if (!_rooms) _rooms = {}
      if (!_rooms[script_id]) _rooms[script_id] = []

      _rooms[script_id].push(room_id)
      await this.redis.set('rooms', _rooms)
    })

    return { room_id, role_ids }
  }

  renameRoom = ({ script_id, room_id, room_name }) => this.rooms[room_id].setRoomName(room_name)

  joinRoom = ({ room_id, player_id }) => {
    const room = this.rooms[room_id]
    if (room instanceof Room) return room.join(player_id)
    return { error: [this.rooms, `could not join room ${room_id} with player_id ${player_id}`] }
  }

  deleteRoom = async ({ room_id }) => {
    if (!this.rooms[room_id]) return

    let script_id = await this.rooms[room_id].getScriptId()

    await this.rooms[room_id].delete()

    await this.process(async () => {
      let _rooms = await this.redis.get('rooms')

      _rooms[script_id] = array_remove_element(_rooms[script_id], room_id)
      await this.redis.set('rooms', _rooms)
    })
  }
  resetRoom = ({ room_id }) => this.rooms[room_id].reset()
  startRoom = ({ room_id }) => this.rooms[room_id].start()

  updateScriptOfRoom = ({ room_id, script_id }) => this.rooms[room_id].updateScript(script_id)

  getAllRoomIds = async () => {
    // TODO: is there a more typesafe way to interface with redis?
    let room_categories = (await this.redis.get('rooms')) as Record<string, string[]>
    if (Object.values(room_categories).length === 0) return []
    return Object.values(room_categories).reduce((a, b) => a.concat(b), [])
  }

  getRooms = async ({ script_id }) => {
    // TODO: is there a more typesafe way to interface with redis?
    const { [script_id]: room_ids } = (await this.redis.get('rooms')) as Record<string, string[]>
    const entries = await Promise.all(
      room_ids.map(async room_id => [room_id, await this.rooms[room_id].getMeta()]),
    )
    return Object.fromEntries(entries)
  }

  getAllMetas = async ({ script_id }) => {
    const { [script_id]: room_ids } = await this.redis.get('rooms')

    if (!room_ids) return {}

    const entries = await Promise.all(
      room_ids.map(async room_id => [
        room_id,
        {
          ...(await this.rooms[room_id].getMeta()),
          instructions_map: await this.rooms[room_id].getInstructionsMap(),
        },
      ]),
    )

    return Object.fromEntries(entries)
  }

  getInstructions = async ({ room_id, player_id }) =>
    this.rooms[room_id]
      ? { instructions: this.rooms[room_id].getPlayer(player_id) }
      : { error: `room with room_id ${room_id} does not exist in RoomManager.rooms` }

  getRoleUrlsOfRoom = ({ room_id }) => this.rooms[room_id].getRoleUrls()

  getGameCount = ({ room_id }) => this.rooms[room_id].getGameCount()
}

class Room {
  // TODO: use zeptoid instead
  room_id = crypto.randomBytes(3).toString('hex')
  script_id?: string

  queue = {}
  received_swipes = {}
  last_interactions = {}
  subscribed_topics = new Set<string>()

  redis: Redis
  mongo: Mongo
  mqtt: Mqtt

  constructor({ redis, mongo, mqtt }) {
    this.redis = redis
    this.mongo = mongo
    this.mqtt = mqtt
  }

  playersFromScript = (script: Script) => {
    const players_meta: Record<string, PlayerMeta> = {}
    const players_instructions: Record<string, Instruction[]> = {}
    const instructions_map: Record<string, string> = {}

    Object.entries(script.roles).forEach(([role_id, role]) => {
      players_instructions[role_id] = role.instructions
      players_meta[role_id] = {
        status: 'uninitialized',
        instruction_index: 0,
        instructions_length: role.instructions.length,
        instruction: role.instructions[0],
        autoswipe: false,
        role_id,
        name: role.name,
        last_interaction: 0,
      }
      role.instructions.forEach(
        ({ instruction_id }) => (instructions_map[instruction_id] = role.name),
      )
    })

    return {
      players_meta,
      players_instructions,
      instructions_map,
    }
  }

  create = async ({ script, script_id }: { script: Script; script_id: string }) => {
    try {
      this.room_id = crypto.randomBytes(3).toString('hex')

      const { players_meta, players_instructions, instructions_map } =
        this.playersFromScript(script)

      // init received_swipes
      this.received_swipes = {}
      Object.keys(players_meta).forEach(player_id => (this.received_swipes[player_id] = []))

      Object.entries(players_instructions).forEach(([player_id, player]) => {
        this.setPlayer({ player_id, player })
        this.setPlayerReset({ player_id, player })
      })

      await Promise.all([
        // init meta
        this.setMeta({
          design_id: script.design_id ? script.design_id : 'europalia3_mikey',
          players: players_meta,
          room_name: this.room_id,
          game_count: 0,
          script_id,
          count: 0,
        }),
        this.setInstructionsMap(instructions_map),
      ])

      this.monitor()

      return { room_id: this.room_id, role_ids: Object.keys(script.roles) }
    } catch (error) {
      console.error(error)
      return { error }
    }
  }

  private process = <T>(key: string, func: () => T) => {
    if (!this.queue[key]) this.queue[key] = new Q()
    return (this.queue[key] as Q).add(func)
  }

  private subscribe = (topic: string, callback: (message: string, topic: string) => void) => {
    this.mqtt.subscribe(topic, callback)
    this.subscribed_topics.add(topic)
  }

  getMeta = async () => (await this.redis.get(this.room_id)) as RoomMeta
  setMeta = (meta: RoomMeta) => this.redis.set(this.room_id, meta)

  private setInstructionsMap = instructions_map =>
    this.redis.set(`${this.room_id}_instructions_map`, instructions_map)
  getInstructionsMap = () => this.redis.get(`${this.room_id}_instructions_map`)

  getGameCount = async () => {
    const meta = await this.getMeta()
    return meta?.game_count
  }

  setPlayer = ({ player_id, player }) => this.redis.set(`${this.room_id}${player_id}`, [player])
  getPlayer = async (player_id: string) =>
    this.redis.get(`${this.room_id}${player_id}`) as Instruction[]

  getPlayerReset = (player_id: string) => this.redis.get(`${this.room_id}${player_id}_reset`)
  setPlayerReset = ({ player_id, player }) =>
    this.redis.set(`${this.room_id}${player_id}_reset`, [player])

  getScriptId = async () => {
    if (!this.script_id) {
      const meta = await this.getMeta()
      this.script_id = meta.script_id
    }
    return this.script_id
  }

  setRoomId = (id: string) => (this.room_id = id)
  setRoomName = room_name =>
    this.process('meta', async () => {
      const meta = await this.getMeta()
      meta.room_name = room_name
      await this.setMeta(meta)
      return true
    })

  private updateMeta = (callback: (meta: RoomMeta) => Promise<RoomMeta>) =>
    this.process('meta', async () => {
      const meta = await callback(await this.getMeta())
      await this.setMeta(meta)
    })

  delete = async () => {
    const meta = await this.getMeta()

    Object.keys(meta.players).forEach(player_id => {
      this.redis.del(`${this.room_id}${player_id}`)
      this.redis.del(`${this.room_id}${player_id}_reset`)
    })

    this.redis.del(this.room_id)

    this.subscribed_topics.forEach(subscribed_topic => this.mqtt.unsubscribe(subscribed_topic))
  }

  reset = async () => {
    // maybe eventually we should make this bit 'smarter':
    // empty the queue, and temporarily prevent adjustments
    // until we get confirmation from all the connected players
    // that they have reseted the game (to prevent out-of-sync)

    let meta = await this.getMeta()
    meta.players = Object.fromEntries(
      Object.entries(meta.players).map(([player_id, player]) => [
        player_id,
        { ...player, instruction_index: 0 },
      ]),
    )
    meta.count = meta.count + 1
    await this.setMeta(meta)

    Object.keys(meta.players).forEach(async player_id => {
      let player = await this.getPlayerReset(player_id)
      this.setPlayer({ player_id, player })
      this.mqtt.send(`/${this.room_id}/${meta.players[player_id].role_id}/reset`, true)
      this.received_swipes[player_id] = []
    })
  }

  start = async () => {
    // maybe eventually we should make this bit 'smarter':
    // empty the queue, and temporarily prevent adjustments
    // until we get confirmation from all the connected players
    // that they have reseted the game (to prevent out-of-sync)

    let meta = await this.getMeta()
    meta.players = Object.fromEntries(
      Object.entries(meta.players).map(([player_id, player]) => [
        player_id,
        { ...player, instruction_index: 0 },
      ]),
    )
    meta.count = meta.count + 1
    await this.setMeta(meta)

    Object.keys(meta.players).forEach(async player_id => {
      let player = await this.getPlayerReset(player_id)
      this.setPlayer({ player_id, player })
      this.mqtt.send(`/${this.room_id}/${meta.players[player_id].role_id}/start`, true)
      this.received_swipes[player_id] = []
    })
  }

  join = (player_id: string) =>
    this.process('meta', async () => {
      try {
        const meta = await this.getMeta()
        const { role_id, instruction_index, autoswipe, status } = meta.players[player_id]

        const instructions = await this.getPlayer(player_id)
        const _instructions = await this.getPlayerReset(player_id)

        if (status !== 'connected') {
          meta.players[player_id].status = 'connected'
          this.mqtt.send(`/monitor/${this.room_id}/${player_id}/status`, { status: 'connected' })
        }

        meta.players[player_id].last_interaction = new Date().getTime()
        await this.setMeta(meta)

        return {
          role_id,
          instructions,
          _instructions,
          instruction_index,
          player_id,
          room_id: this.room_id,
          autoswipe,
          design_id: meta.design_id,
        }
      } catch (error) {
        console.error(error)
        return { error }
      }
    })

  privategetRoleUrls = async () => {
    let meta = await this.getMeta()
    return { player_ids: Object.keys(meta.players) }
  }

  private updateInstructionIndexOfPlayer = ({ player_id, instruction_index }) =>
    this.updateMeta(async meta => {
      meta.players[player_id].instruction_index = instruction_index
      return meta
    })

  private updateCurrentInstructionOfPlayer = ({ player_id, instruction_index }) =>
    this.updateMeta(async meta => {
      // update current_card for the monitor
      const instructions = await this.getPlayer(player_id)
      const instruction = instructions[instruction_index]

      meta.players[player_id].instruction = instruction

      this.mqtt.send(
        `/monitor/${this.room_id}/${meta.players[player_id].role_id}/current_instruction`,
        instruction,
      )

      return meta
    })

  private removeFromPrevInstructionIdsOfPlayer = ({ player_id, instruction_id }) =>
    this.process(player_id, async () => {
      try {
        let player = await this.getPlayer(player_id)

        let instruction_index = player.findIndex(instruction => {
          return instruction.prev_instruction_ids.indexOf(instruction_id) !== -1
        })
        if (!instruction_index && instruction_index !== 0)
          throw `could not find instruction ${instruction_id} in player ${player_id}`

        let instruction = player[instruction_index]
        instruction.prev_instruction_ids = instruction.prev_instruction_ids.filter(
          v => v != instruction_id,
        )
        await this.setPlayer({ player_id, player })
        return { instruction, instruction_index }
      } catch (error) {
        console.error(error)
        return { error }
      }
    })

  updateLastInteractionPlayer = player_id =>
    this.updateMeta(async meta => {
      meta.players[player_id].last_interaction = new Date().getTime()
      return meta
    })

  checkLastInteractions = () =>
    this.process('meta', async () => {
      let meta = await this.getMeta()

      if (!meta) return

      const now = new Date().getTime()
      let meta_has_changed = false

      Object.entries(meta.players).forEach(([player_id, player]) => {
        if (player.status === 'connected' && now - player.last_interaction > 5000) {
          player.status = 'disconnected'
          this.mqtt.send(`/monitor/${this.room_id}/${player_id}/status`, { status: 'disconnected' })
          meta_has_changed = true
        } else if (player.status !== 'connected' && now - player.last_interaction < 5000) {
          player.status = 'connected'
          this.mqtt.send(`/monitor/${this.room_id}/${player_id}/status`, { status: 'connected' })
          meta_has_changed = true
        }
      })

      if (meta_has_changed) await this.setMeta(meta)

      setTimeout(this.checkLastInteractions, 2000)
    })

  monitorPlayer = ({ player_id, player }) => {
    // listen for ping
    this.subscribe(`/${this.room_id}/${player.role_id}/ping`, async message => {
      try {
        const { timestamp } = JSON.parse(message)

        if (typeof timestamp !== 'number') return

        const now = new Date().getTime()
        const ping = Math.floor(now - timestamp)

        this.mqtt.send(`/monitor/${this.room_id}/${player.role_id}/ping`, { ping })
        this.mqtt.send(`/${this.room_id}/${player.role_id}/pong`, { timestamp })

        this.updateLastInteractionPlayer(player_id)
      } catch (err) {
        console.error(err)
      }
    })

    // update current instruction_index of player
    this.subscribe(`/${this.room_id}/${player.role_id}/instruction_index`, async message => {
      try {
        let { instruction_index } = JSON.parse(message)

        this.updateInstructionIndexOfPlayer({ player_id, instruction_index })
        this.updateCurrentInstructionOfPlayer({ player_id, instruction_index })
      } catch (err) {
        console.error(err)
      }
    })

    // remove swiped instruction from instructions
    this.subscribe(`/${this.room_id}/${player.role_id}/swipe`, async message => {
      try {
        let { instruction_id } = JSON.parse(message)

        if (!this.received_swipes[player_id]) this.received_swipes[player_id] = []
        if (this.received_swipes[player_id].indexOf(instruction_id) !== -1) return

        this.received_swipes[player_id].push(instruction_id)

        let { instruction, instruction_index, error } =
          await this.removeFromPrevInstructionIdsOfPlayer({
            player_id,
            instruction_id,
          })
        if (error) {
          console.error(
            'removeFromPrevInstructionIdsOfPlayer failed during swipe for player ',
            player.role_id,
          )
        }
        this.process('meta', async () => {
          let meta = await this.getMeta()
          let player_meta = meta.players[player_id]
          if (player_meta.instruction_index === instruction_index) {
            this.mqtt.send(
              `/monitor/${this.room_id}/${player.role_id}/current_instruction`,
              instruction,
            )
            player_meta.instruction = instruction
            await this.setMeta(meta)
          }
        })
      } catch (err) {
        console.error(err)
      }
    })

    this.subscribe(`/${this.room_id}/${player.role_id}/reset/confirmation`, () => {
      console.info('received confirmation from ', player.role_id, 'of room', this.room_id)
    })

    this.subscribe(`/${this.room_id}/${player.role_id}/autoswipe`, message => {
      let { autoswipe } = JSON.parse(message)

      this.updateMeta(async meta => {
        let player_meta = meta.players[player_id]
        if (autoswipe === player_meta.autoswipe) return meta
        player_meta.autoswipe = autoswipe
        return meta
      })
    })
  }

  monitor = async () => {
    try {
      let { players, script_id, room_name } = await this.getMeta()
      let instructions_map = await this.getInstructionsMap()

      Object.entries(players).forEach(([player_id, player]) =>
        this.monitorPlayer({ player_id, player }),
      )
      this.mqtt.send(
        `/createRoom/${script_id}`,
        JSON.stringify({ room_id: this.room_id, players, script_id, instructions_map, room_name }),
      )

      this.checkLastInteractions()
    } catch (err) {
      console.error(err)
    }
  }
}
