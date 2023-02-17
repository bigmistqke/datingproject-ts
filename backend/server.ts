import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import fileUpload from 'express-fileupload'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { Design, DesignElementSvg } from '../types'

import DatabaseManager from './managers/Database'
import RoomManager from './managers/Room'

import createPoster from './utils/createPoster'

import Mongo from './wrappers/Mongo'
import Mqtt from './wrappers/Mqtt'
import Redis from './wrappers/Redis'

const app = express()
app.use(cors())
app.use(compression())
app.listen(8079)

const mongo = new Mongo({ url: 'mongodb://localhost:27017' })
const redis = new Redis()
const mqtt = new Mqtt()

const db = new DatabaseManager({ mongo, redis })
const rooms = new RoomManager({ mongo, redis, mqtt })

const isDev = true
const mqtt_url = isDev ? 'localhost:8883' : 'socket.datingproject.net/mqtt'

mongo
  .connect('datingProject')
  .then(() => mqtt.connect(mqtt_url, true))
  .then(() => rooms.init())
  .catch(e => console.error('error while connecting to mongo:', e))

app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: false,
  }),
)
app.use(bodyParser.json({ limit: '50mb' }))

app.use(fileUpload())

app.get('/api/getServerTime', (req, res) => res.json({ timestamp: new Date().getTime() }))

// upload video
app.post('/api/uploadVideo/:script_id/:type', async function (req, res) {
  try {
    const script_path = `./uploads/${req.params.script_id}`
    if (!fs.existsSync(script_path)) {
      fs.mkdirSync(script_path)
    }
    const new_filename = `${req.body.instruction_id}${path.extname(req.files.file.name)}`
    const new_path = `${script_path}/${new_filename}`

    fs.writeFile(new_path, req.files.file.data, async err => {
      if (!err) {
        createPoster(new_path)
        setTimeout(() => {
          res.send(new_path)
        }, 1000)
      } else {
        res.send(err)
      }
    })
  } catch (e) {
    console.error('an error happened while trying to upload a video: ', e)
  }
})

app.post('/api/video/createPoster', function (req, res, next) {
  const file_path = req.body.file_path
  if (!file_path) res.status(400).send('did not include file_path in the body')

  createPoster(file_path)
  /* createPoster(new_path);
  res.status(200) */
})

// access point to download video
app.get('/api/downloadVideo/:file_name', async (req, res, next) => {
  const file_name = req.params.file_name
  res.attachment(`/api/uploads/${file_name}`)
})

// script

// save script
app.post('/api/script/save/:script_id', async function (req, res, next) {
  // TODO:  sanitize content
  console.log('/api/script/save/:script_id')
  const script = req.body
  const script_id = req.params.script_id
  const result = await db.saveScript({ script_id, script })
  res.json(result)
})

// get script
app.get('/api/script/get/:script_id/:mode', async function (req, res) {
  const { mode, script_id } = req.params
  const start = new Date().getTime()

  const results = await db.getScript(script_id)

  if (results) {
    res.status(200).send(mode in results ? results[mode] : results)
  } else {
    res.sendStatus(404)
  }
})

// delete script
app.get('/api/script/delete/:script_id', async function (req, res, next) {
  try {
    const script_id = req.params.script_id
    const response = await db.deleteScript({ script_id })
    res.send(response)
  } catch (e) {
    console.error(e)
  }
})

// get all scripts
app.get('/api/script/get_all', async function (req, res) {
  const results = await db.getAllScripts()
  const script_ids = results.map(r => r.script_id)

  if (script_ids) {
    res.status(200).json(script_ids)
  } else {
    res.sendStatus(404)
  }
})

// test script

// test script
app.post('/api/script/test/:script_id', async function (req, res, next) {
  const { script_id } = req.params
  const script = req.body
  const { room, room_id, role_ids } = await rooms.createRoom({ script_id, script })
  db.initStats({ script_id, room_id, role_ids })
  // _rooms.monitor({ room_id });
  res.json({ room_id })
})

// ROOM

/* // create room
app.post('/api/room/create/:script_id', async function (req, res, next) {
  const { script_id } = req.params;
  const { roles, room_id, error } = await _rooms.createRoom({ script_id });
  // _rooms.monitor({ room_id, roles, script_id });
  res.json({ roles, room_id, error });
}) */

// delete room
app.get('/api/room/delete/:room_id', async function (req, res, next) {
  try {
    const room_id = req.params.room_id
    const response = await rooms.deleteRoom({ room_id })
    res.send(response)
  } catch (e) {
    console.error(e)
  }
})

// reset room
app.get('/api/room/reset/:room_id', async function (req, res, next) {
  try {
    const room_id = req.params.room_id
    const response = await rooms.resetRoom({ room_id })

    res.send(response)
  } catch (e) {
    console.error(e)
  }
})

// start room
app.get('/api/room/start/:room_id', async function (req, res, next) {
  try {
    const room_id = req.params.room_id
    const response = await rooms.startRoom({ room_id })

    res.send(response)
  } catch (e) {
    console.error(e)
  }
})

// rename room
app.post('/api/room/rename/:room_id', async function (req, res, next) {
  try {
    const room_id = req.params.room_id
    const { room_name, script_id } = req.body

    const response = await rooms.renameRoom({ script_id, room_id, room_name })
    res.send(response)
  } catch (e) {
    console.error(e)
  }
})

// status room
app.get('/api/room/status', async function (req, res, next) {
  try {
  } catch (e) {
    console.error(e)
  }
})

// join room + fetch role
app.get('/api/room/join/:url', async function (req, res, next) {
  const { url } = req.params
  const room_id = url.slice(0, 6)
  const player_id = url.slice(6)

  const join_result = await rooms.joinRoom({ room_id, player_id })
  if (join_result.error) {
    console.error(join_result.error)
    res.status(404).send(join_result.error)
    return
  }

  if (!join_result.sound) join_result.sound = 'ping.mp3'
  if (!join_result.design_id) join_result.design_id = 'europalia3_mikey'
  const { design, modified } = await db.getDesign({ design_id: join_result.design_id })

  mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'connected' }))

  res.json({
    success: true,
    room_id,
    player_id,
    design: { ...design.production, modified },
    ...join_result,
  })
})

// get all the player_ids of a room (for the combo-test)
app.get('/api/room/getRoleUrls/:room_id', async function (req, res, next) {
  const room_id = req.params.room_id
  try {
    const { player_ids } = await rooms.getRoleUrlsOfRoom({ room_id })
    if (!player_ids) res.send(false)
    else res.json({ player_ids, room_id })
  } catch (e) {
    res.json({ error: e })
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/getRooms/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id
  try {
    const start = new Date().getTime()
    const rooms = await rooms.getRooms({ script_id })

    res.json(rooms)
  } catch (e) {
    res.json({ error: e })
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/metadata/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id
  try {
    const rooms = await rooms.getAllMetas({ script_id })

    res.json(rooms)
  } catch (e) {
    res.json({ error: e })
  }
})

app.get('api/room/getInstructions/:room_id/:player_id', async function (req, res, next) {
  const { room_id, player_id } = req.params

  const { instructions, error } = await rooms.getInstructions({ room_id, player_id })

  if (error) {
    console.error(error)
    res.json({ error })
  } else {
    res.json({ instructions })
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/update/:room_id/:script_id', async function (req, res, next) {
  const room_id = req.params.room_id
  const script_id = req.params.script_id

  try {
    const result = await rooms.updateScriptOfRoom({ room_id, script_id })
    res.json(result)
  } catch (error) {
    res.json({ error })
  }
})

// get stats from a player regarding time it took to perform a swipe
app.post('/api/room/stats/save/:room_id/:role_id', async function (req, res, next) {
  const { room_id, role_id } = req.params

  const stats = req.body
  const game_count = await rooms.getGameCount({ room_id })
  db.saveStats({ room_id, role_id, stats })
  res.sendStatus(200)
})
// CARD

app.post('/api/design/uploadImage/:card_id/:image_id', async function (req, res, next) {
  if (!req.files) {
    res.status(500).send('no image included')
    return
  }
  if (Array.isArray(req.files.file)) {
    res.status(500).send('only one image allowed')
    return
  }
  const { card_id, image_id } = req.params
  const card_path = `./designs/${card_id}`
  !fs.existsSync(card_path) ? fs.mkdirSync(card_path) : null
  const new_filename = `${image_id}${path.extname(req.files.file.name)}`
  const new_path = `${card_path}/${new_filename}`
  fs.writeFile(new_path, req.files.file.data, async err => {
    if (!err) {
      res.send(new_path)
    } else {
      res.status(500).send(err)
    }
  })
})

const uploadSvgsAsPng = ({ design_id, design }: { design_id: string; design: Design }) => {
  const base_url = `./designs/${design_id}`
  const card_dimensions = design.production.card_dimensions
  // const promises: Promise<void>[] = []

  if (!fs.existsSync(base_url)) {
    fs.mkdirSync(base_url)
  }

  const svgs = Object.values(design.production.types)
    .flat()
    .filter(element => element.type === 'svg') as DesignElementSvg[]

  const promises = svgs.map(async element => {
    const CONSTANT = 10
    const dim = {
      width: Math.floor(element.dimensions.width * (card_dimensions.width / 100) * CONSTANT),
      height: Math.floor(element.dimensions.height * (card_dimensions.height / 100) * CONSTANT),
    }
    await sharp(Buffer.from(element.svg.normal))
      .resize(dim)
      .toFile(`${base_url}/${element.id}_normal.png`)
    await sharp(Buffer.from(element.svg.masked))
      .resize(dim)
      .toFile(`${base_url}/${element.id}_masked.png`)
  })

  return Promise.all(promises)
}

app.post('/api/design/save/:design_id', async function (req, res, next) {
  try {
    // TODO:  sanitize content
    const { design_id } = req.params

    const design = req.body

    await uploadSvgsAsPng({ design_id, design })

    const saved = await db.saveDesign({ design_id, design })
    res.status(200).send(saved)
  } catch (err) {
    console.error(`error ${err}`)
    res.status(500).send(err)
  }
})

app.get('/api/design/get_all', async (req, res, next) => {
  const data = await db.getAllDesigns()
  if (!data) res.status(500).send('error while querying database')
  else res.status(200).json(data)
})

app.get('/api/design/get/:design_id/:mode', async function (req, res, next) {
  try {
    const { design_id, mode } = req.params
    const data = await db.getDesign({ design_id })
    if (!data) {
      res.status(404).send('could not find design')
      return
    }
    res.json({ design: data.design[mode], modified: data.modified })
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
})

app.use('/api/uploads', express.static(__dirname + '/uploads'))
app.use('/api/designs', express.static(__dirname + '/designs'))
app.use('/api/sounds', express.static(__dirname + '/sounds'))

app.use('/api/system', express.static('system'))

app.get('/api/video/:script_id/:file_id', req => {
  const { script_id, file_id } = req.params
})
