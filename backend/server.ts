import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import fileUpload from 'express-fileupload'
import fs from 'fs'
import path from 'path'

import DatabaseManager from './managers/Database'
import RoomManager from './managers/Room'

import createPoster from './utils/createPoster'

import Mongo from './wrappers/Mongo'
import Mqtt from './wrappers/Mqtt'
import Redis from './wrappers/Redis'

import { fileTypeFromBuffer } from 'file-type'
import ErrorWithStatus from './utils/ErrorWithStatus'
import uploadSvgsAsPng from './utils/uploadSvgsAsPng'

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

// SCRIPT

// save script
app.post('/api/script/save/:script_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    // TODO:  sanitize content

    const script = req.body
    const script_id = req.params.script_id

    const result = await db.saveScript({ script_id, script })

    res.json(result)
  } catch (err) {
    console.error('error while saving script: ' + err.message)
    res.status(err.code).send('error while saving script: ' + err.message)
  }
})

// fetch script
app.get('/api/script/get/:script_id/:mode', async function (req, res) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const { mode, script_id } = req.params

    const results = await db.getScript(script_id)
    if (!results) throw ErrorWithStatus('could not find script in database', 404)

    res.send(mode in results ? results[mode] : results)
  } catch (err) {
    console.error('error while fetching script: ', err)
    res.status(err.code).send('error while fetching script: ' + err.message)
  }
})

// delete script
app.get('/api/script/delete/:script_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const script_id = req.params.script_id

    const response = await db.deleteScript({ script_id })

    res.send(response)
  } catch (err) {
    console.error('error while deleting script: ', err)
    res.status(err.code).send('error while deleting script: ' + err.message)
  }
})

// fetch all scripts
app.get('/api/script/get_all', async function (req, res) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const results = await db.getAllScripts()
    const script_ids = results.map(r => r.script_id)

    if (!script_ids) throw ErrorWithStatus('error while fetching all scripts', 500)

    res.json(script_ids)
  } catch (err) {
    console.error('error fetching all scripts: ' + err.message)
    res.status(err.code).send('error while fetching all scripts: ' + err.message)
  }
})

// test script

// test script
app.post('/api/script/test/:script_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const { script_id } = req.params
    const script = req.body

    const { room_id, role_ids } = await rooms.createRoom({ script_id, script })

    db.initStats({ script_id, room_id, role_ids })

    res.json({ room_id })
  } catch (err) {
    console.error('error while testing script: ' + err.message)
    res.status(err.code).send('error while testing script: ' + err.message)
  }
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
  console.info(req.path, JSON.stringify(req.params))

  try {
    const room_id = req.params.room_id

    const response = await rooms.deleteRoom({ room_id })

    res.send(response)
  } catch (err) {
    console.error('error while deleting room: ' + err.message)
    res.status(err.code).send('error while deleting room: ' + err.message)
  }
})

// reset room
app.get('/api/room/reset/:room_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const room_id = req.params.room_id

    const response = await rooms.resetRoom({ room_id })

    res.send(response)
  } catch (err) {
    console.error('error while resetting room: ' + err.message)
    res.status(err.code).send('error while resetting room: ' + err.message)
  }
})

// start room
app.get('/api/room/start/:room_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const room_id = req.params.room_id

    const response = await rooms.startRoom({ room_id })

    res.send(response)
  } catch (err) {
    console.error('error while starting room: ' + err.message)
    res.status(err.code).send('error while starting room: ' + err.message)
  }
})

// rename room
app.post('/api/room/rename/:room_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const room_id = req.params.room_id
    const { room_name, script_id } = req.body

    const response = await rooms.renameRoom({ script_id, room_id, room_name })

    res.send(response)
  } catch (err) {
    console.error('error while renaming room: ' + err.message)
    res.status(err.code).send('error while renaming room: ' + err.message)
  }
})

// join room
app.get('/api/room/join/:url', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const { url } = req.params
    const room_id = url.slice(0, 6)
    const player_id = url.slice(6)

    const join_result = await rooms.joinRoom({ room_id, player_id })
    if ('error' in join_result) {
      throw ErrorWithStatus('error while joining room ' + join_result.error, 500)
    }

    if (!join_result.design_id) join_result.design_id = 'europalia3_mikey'

    const result = await db.getDesign({
      design_id: join_result.design_id,
    })

    if (!result)
      throw ErrorWithStatus('error while fetching design with id ' + join_result.design_id, 404)

    const { design, modified } = result

    mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'connected' }))

    res.json({
      success: true,
      design: { ...design.production, modified },
      ...join_result,
      sound: 'ping.mp3',
    })
  } catch (err) {
    console.error('error while joining room: ' + err.message)
    res.status(err.code).send('error while fetching design with id: ' + err.message)
  }
})

// fetch all role_urls/player_ids of room
app.get('/api/room/getRoleUrls/:room_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const room_id = req.params.room_id
    const { player_ids } = await rooms.getRoleUrlsOfRoom({ room_id })
    if (!player_ids) throw ErrorWithStatus('player_ids is undefined', 404)

    res.json({ player_ids, room_id })
  } catch (err) {
    console.error('error while fetching all role_urls: ' + err.message)
    res.status(err.code).send('error while fetching all role_urls: ' + err.message)
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/getRooms/:script_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const script_id = req.params.script_id
    const result = await rooms.getRooms({ script_id })

    res.json(result)
  } catch (err) {
    console.error('error while fetching all rooms: ' + err.message)
    res.status(err.code).send('error while fetching all rooms: ' + err.message)
  }
})

// fetch active rooms with certain script_id (for game-master)
app.get('/api/room/metadata/:script_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const script_id = req.params.script_id
    const result = await rooms.getAllMetas({ script_id })

    res.json(result)
  } catch (err) {
    console.error('error while fetching all rooms: ' + err.message)
    res.status(err.code).send('error while fetching all rooms: ' + err.message)
  }
})

// fetch all instructions of room with room_id for player with player_id
app.get('api/room/getInstructions/:room_id/:player_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const { room_id, player_id } = req.params

    const { instructions, error } = await rooms.getInstructions({ room_id, player_id })
    if (error) throw ErrorWithStatus(error, 500)

    res.json({ instructions })
  } catch (err) {
    console.error('error while fetching all rooms: ' + err.message)
    res.status(err.code).send('error while fetching all rooms: ' + err.message)
  }
})

// fetch active rooms with certain script_id
app.get('/api/room/update/:room_id/:script_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const { room_id } = req.params
    const script_id = req.params.script_id

    const result = await rooms.updateScriptOfRoom({ room_id, script_id })

    res.json(result)
  } catch (err) {
    console.error('error while fetching active rooms: ' + err.message)
    res.status(err.code).send('error while fetching active rooms: ' + err.message)
  }
})

// get stats from a player regarding time it took to perform a swipe
app.post('/api/room/stats/save/:room_id/:role_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const { room_id, role_id } = req.params
    const stats = req.body
    db.saveStats({ room_id, role_id, stats })

    res.sendStatus(200)
  } catch (err) {
    console.error('error while fetching stats: ' + err.message)
    res.status(err.code).send('error while fetching stats: ' + err.message)
  }
})

// CARD-DESIGN

// upload image to design
app.post('/api/design/uploadImage/:card_id/:image_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    if (!req.files) throw ErrorWithStatus('no image included', 400)

    if (Array.isArray(req.files.file)) throw ErrorWithStatus('only one image allowed', 500)

    const { card_id, image_id } = req.params
    const card_path = `./designs/${card_id}`
    !fs.existsSync(card_path) ? fs.mkdirSync(card_path) : null
    const new_filename = `${image_id}${path.extname(req.files.file.name)}`
    const new_path = `${card_path}/${new_filename}`

    fs.writeFile(new_path, req.files.file.data, async err => {
      if (err) next(err)
      res.send(new_path)
    })
  } catch (err) {
    console.error('error while uploading image to design', err)
    res.status(err.code).send('error while uploading image to design: ' + err.message)
  }
})

// save design
app.post('/api/design/save/:design_id', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    // TODO:  sanitize content
    const { design_id } = req.params

    const design = req.body
    await uploadSvgsAsPng({ design_id, design })
    const saved = await db.saveDesign({ design_id, design })

    res.send(saved)
  } catch (err) {
    console.error('error while saving design', err)
    res.status(err.code).send('error while saving design: ' + err.message)
  }
})

// error while fetching all scripts
app.get('/api/design/get_all', async (req, res, next) => {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const data = await db.getAllDesigns()
    if (!data) throw ErrorWithStatus('error while querying database', 500)

    res.json(data)
  } catch (err) {
    console.error('error while fetching all scripts', err)
    res.status(err.code).send('error while fetching all scripts: ' + err.message)
  }
})

// upload video
app.post('/api/uploadVideo/:script_id/:type', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    if (!req.files) throw ErrorWithStatus('should include one video-file', 406)

    if (Array.isArray(req.files.file))
      throw ErrorWithStatus('should only include one video-file', 406)

    const filetype = await fileTypeFromBuffer(req.files.file.data)

    if (!filetype || filetype?.mime !== 'video/mp4')
      throw ErrorWithStatus('should include valid video-file', 406)

    const script_path = `./uploads/${req.params.script_id}`
    if (!fs.existsSync(script_path)) fs.mkdirSync(script_path)

    const new_filename = `${req.body.instruction_id}${path.extname(req.files.file.name)}`
    const new_path = `${script_path}/${new_filename}`

    fs.writeFile(new_path, req.files.file.data, async err => {
      if (err) next(err)
      createPoster(new_path)
      setTimeout(() => res.send(new_path), 1000)
    })
  } catch (err) {
    console.error('error while uploading video', err)
    res.status(err.code).send('error while uploading video' + err.message)
  }
})

// create poster for video
app.post('/api/video/createPoster', function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const file_path = req.body.file_path

    if (!file_path) throw ErrorWithStatus('did not include file_path in the body', 400)

    createPoster(file_path)
    res.sendStatus(200)
  } catch (err) {
    console.error('error while creating poster of video', err)
    res.status(err.code).send('error while creating poster of video: ' + err.message)
  }
})

// end-point to download video
app.get('/api/downloadVideo/:file_name', async (req, res, next) => {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const file_name = req.params.file_name

    res.attachment(`/api/uploads/${file_name}`)
  } catch (err) {
    console.error('error while deleting script: ' + err.message)
    res.status(err.code).send('error while deleting script: ' + err.message)
  }
})

// fetch design
app.get('/api/design/get/:design_id/:mode', async function (req, res, next) {
  console.info(req.path, JSON.stringify(req.params))

  try {
    const { design_id, mode } = req.params
    const data = await db.getDesign({ design_id })
    if (!data) throw ErrorWithStatus('could not fetch design', 404)

    res.json({ design: data.design[mode], modified: data.modified })
  } catch (err) {
    console.error('error while fetching design', err.message)
    res.status(err.status).send('error while fetching design: ' + err.message)
  }
})

app.use('/api/uploads', express.static(__dirname + '/uploads'))
app.use('/api/designs', express.static(__dirname + '/designs'))
app.use('/api/sounds', express.static(__dirname + '/sounds'))

app.use('/api/system', express.static('system'))

app.get('/api/video/:script_id/:file_id', req => {
  const { script_id, file_id } = req.params
})
