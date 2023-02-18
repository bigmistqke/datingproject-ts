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

import { fileTypeFromBuffer } from 'file-type'
import ErrorWithStatus from './utils/ErrorWithStatus'

const uploadSvgsAsPng = ({ design_id, design }: { design_id: string; design: Design }) => {
  const base_url = `./designs/${design_id}`
  const card_dimensions = design.production.card_dimensions

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
    console.info('/api/uploadVideo/:script_id/:type')

    if (!req.files) throw [406, 'should include one video-file']

    if (Array.isArray(req.files.file)) throw [406, 'should only include one video-file']

    const filetype = await fileTypeFromBuffer(req.files.file.data)

    if (!filetype || filetype?.mime !== 'video/mp4') throw [406, 'should include valid video-file']

    const script_path = `./uploads/${req.params.script_id}`
    if (!fs.existsSync(script_path)) fs.mkdirSync(script_path)

    const new_filename = `${req.body.instruction_id}${path.extname(req.files.file.name)}`
    const new_path = `${script_path}/${new_filename}`

    fs.writeFile(new_path, req.files.file.data, async err => {
      if (err) throw [500, err]
      createPoster(new_path)
      setTimeout(() => res.send(new_path), 1000)
    })
    res.sendStatus(200)
  } catch (err) {
    if (Array.isArray(err)) {
      const [server, error] = err
      console.error('error while uploading video', err)
      res.status(server).send(error)
      return
    }

    console.error('unhandled error while uploading video', err)
    res.status(500).send(err)
  }
})

// create poster for video
app.post('/api/video/createPoster', function (req, res, next) {
  try {
    console.info('/api/video/createPoster')

    const file_path = req.body.file_path

    if (!file_path) throw 'did not include file_path in the body'

    createPoster(file_path)
    res.sendStatus(200)
  } catch (err) {
    console.error('error while creating poster of video', err)
    res.status(400).send(err)
  }
})

// end-point to download video
app.get('/api/downloadVideo/:file_name', async (req, res, next) => {
  try {
    console.info('/api/downloadVideo/:file_name')

    const file_name = req.params.file_name

    res.attachment(`/api/uploads/${file_name}`)
  } catch (err) {
    console.error('error while deleting script ' + err)
    res.status(500).json(err)
  }
})

// SCRIPT

// save script
app.post('/api/script/save/:script_id', async function (req, res, next) {
  try {
    console.info('/api/script/save/:script_id')

    // TODO:  sanitize content

    const script = req.body
    const script_id = req.params.script_id
    const result = await db.saveScript({ script_id, script })

    res.status(200).json(result)
  } catch (err) {
    console.error('error while saving script ' + err)
    res.status(500).send(err)
  }
})

// fetch script
app.get('/api/script/get/:script_id/:mode', async function (req, res) {
  try {
    console.info('/api/script/get/:script_id/:mode')

    const { mode, script_id } = req.params
    const results = await db.getScript(script_id)

    if (!results) throw 'could not find script in database'

    res.status(200).send(mode in results ? results[mode] : results)
  } catch (err) {
    console.error('error while fetching script: ', err)
    res.status(404).send(err)
  }
})

// delete script
app.get('/api/script/delete/:script_id', async function (req, res, next) {
  try {
    console.info('/api/script/delete/:script_id')

    const script_id = req.params.script_id
    const response = await db.deleteScript({ script_id })

    res.status(200).send(response)
  } catch (err) {
    console.error('error while deleting script: ', err)
    res.status(500).send('error while deleting script: ' + err)
  }
})

// fetch all scripts
app.get('/api/script/get_all', async function (req, res) {
  try {
    console.info('/api/script/get_all')

    const results = await db.getAllScripts()
    const script_ids = results.map(r => r.script_id)

    if (!script_ids) throw 'error while fetching all scripts'

    res.status(200).json(script_ids)
  } catch (err) {
    console.error('error fetching all scripts ' + err)
    res.status(500).send('error while fetching all scripts')
  }
})

// test script

// test script
app.post('/api/script/test/:script_id', async function (req, res, next) {
  try {
    console.info('/api/script/test/:script_id')

    const { script_id } = req.params
    const script = req.body
    const { room_id, role_ids } = await rooms.createRoom({ script_id, script })

    db.initStats({ script_id, room_id, role_ids })

    res.status(200).json({ room_id })
  } catch (err) {
    console.error('error while testing script ' + err)
    res.status(500).json(err)
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
  try {
    console.info('/api/room/delete/:room_id')

    const room_id = req.params.room_id
    const response = await rooms.deleteRoom({ room_id })
    res.status(200).send(response)
  } catch (err) {
    console.error('error while deleting room ' + err)
    res.status(500).send('error while deleting room ' + err)
  }
})

// reset room
app.get('/api/room/reset/:room_id', async function (req, res, next) {
  try {
    console.info('/api/room/reset/:room_id')

    const room_id = req.params.room_id
    const response = await rooms.resetRoom({ room_id })

    res.status(200).send(response)
  } catch (err) {
    console.error('error while resetting room ' + err)
    res.status(500).send('error while resetting room ' + err)
  }
})

// start room
app.get('/api/room/start/:room_id', async function (req, res, next) {
  console.info('/api/room/start/:room_id')

  try {
    const room_id = req.params.room_id
    const response = await rooms.startRoom({ room_id })

    res.status(200).send(response)
  } catch (err) {
    console.error('error while starting room ' + err)
    res.status(500).send('error while starting room ' + err)
  }
})

// rename room
app.post('/api/room/rename/:room_id', async function (req, res, next) {
  console.info('/api/room/rename/:room_id')

  try {
    const room_id = req.params.room_id
    const { room_name, script_id } = req.body

    const response = await rooms.renameRoom({ script_id, room_id, room_name })
    res.status(200).send(response)
  } catch (err) {
    console.error('error while renaming room ' + err)
    res.status(500).send('error while renaming room ' + err)
  }
})

// join room
app.get('/api/room/join/:url', async function (req, res, next) {
  try {
    console.info('/api/room/join/:url')

    const { url } = req.params
    const room_id = url.slice(0, 6)
    const player_id = url.slice(6)

    const join_result = await rooms.joinRoom({ room_id, player_id })
    if ('error' in join_result) {
      console.error(join_result.error)
      throw 'error while joining room ' + join_result.error
    }

    if (!join_result.design_id) join_result.design_id = 'europalia3_mikey'

    const result = await db.getDesign({
      design_id: join_result.design_id,
    })

    if (!result) {
      throw 'error while fetching design with id ' + join_result.design_id
    }

    const { design, modified } = result

    mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'connected' }))

    res.json({
      success: true,
      design: { ...design.production, modified },
      ...join_result,
      sound: 'ping.mp3',
    })
  } catch (err) {
    console.error('error while joining room ' + err)
    res.status(404).send('error while fetching design with id ' + err)
  }
})

// fetch all role_urls/player_ids of room
app.get('/api/room/getRoleUrls/:room_id', async function (req, res, next) {
  try {
    console.info('/api/room/getRoleUrls/:room_id')

    const room_id = req.params.room_id
    const { player_ids } = await rooms.getRoleUrlsOfRoom({ room_id })
    if (!player_ids) res.send(false)
    else res.json({ player_ids, room_id })
  } catch (err) {
    console.error('error while fetching all role_urls ' + err)
    res.status(500).send(err)
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/getRooms/:script_id', async function (req, res, next) {
  try {
    console.info('/api/room/getRooms/:script_id')

    const script_id = req.params.script_id
    const result = await rooms.getRooms({ script_id })

    res.json(result)
  } catch (err) {
    console.error('error while fetching all rooms ' + err)
    res.status(500).json(err)
  }
})

// fetch active rooms with certain script_id (for game-master)
app.get('/api/room/metadata/:script_id', async function (req, res, next) {
  try {
    console.info('/api/room/metadata/:script_id')

    const script_id = req.params.script_id
    const result = await rooms.getAllMetas({ script_id })

    res.json(result)
  } catch (err) {
    console.error('error while fetching all rooms ' + err)
    res.status(500).json(err)
  }
})

// fetch all instructions of room with room_id for player with player_id
app.get('api/room/getInstructions/:room_id/:player_id', async function (req, res, next) {
  try {
    console.info('api/room/getInstructions/:room_id/:player_id')

    const { room_id, player_id } = req.params
    const { instructions, error } = await rooms.getInstructions({ room_id, player_id })
    if (error) throw error

    res.status(200).json({ instructions })
  } catch (err) {
    console.error('error while fetching all rooms ' + err)
    res.status(500).json(err)
  }
})

// fetch active rooms with certain script_id
app.get('/api/room/update/:room_id/:script_id', async function (req, res, next) {
  try {
    console.info('/api/room/update/:room_id/:script_id')

    const { room_id } = req.params
    const script_id = req.params.script_id
    const result = await rooms.updateScriptOfRoom({ room_id, script_id })

    res.status(200).json(result)
  } catch (err) {
    console.error('error while fetching active rooms ' + err)
    res.status(500).json(err)
  }
})

// get stats from a player regarding time it took to perform a swipe
app.post('/api/room/stats/save/:room_id/:role_id', async function (req, res, next) {
  try {
    console.info('/api/room/stats/save/:room_id/:role_id')

    const { room_id, role_id } = req.params
    const stats = req.body
    //const game_count = await rooms.getGameCount({ room_id })
    db.saveStats({ room_id, role_id, stats })

    res.sendStatus(200)
  } catch (err) {
    console.error('error while fetching active rooms ' + err)
    res.status(err.code).json(err)
  }
})

// CARD

// upload image to design
app.post('/api/design/uploadImage/:card_id/:image_id', async function (req, res, next) {
  try {
    console.info('/api/design/uploadImage/:card_id/:image_id')

    if (!req.files) throw 'no image included'

    if (Array.isArray(req.files.file)) throw 'only one image allowed'

    const { card_id, image_id } = req.params
    const card_path = `./designs/${card_id}`
    !fs.existsSync(card_path) ? fs.mkdirSync(card_path) : null
    const new_filename = `${image_id}${path.extname(req.files.file.name)}`
    const new_path = `${card_path}/${new_filename}`

    fs.writeFile(new_path, req.files.file.data, async err => {
      if (err) throw 'error while writing file' + err
      res.send(new_path)
    })
  } catch (err) {
    console.error('error while uploading image to design', err)
    res.status(500).json(err)
  }
})

// save design
app.post('/api/design/save/:design_id', async function (req, res, next) {
  try {
    console.info('/api/design/save/:design_id')

    // TODO:  sanitize content
    const { design_id } = req.params

    const design = req.body

    await uploadSvgsAsPng({ design_id, design })

    const saved = await db.saveDesign({ design_id, design })
    res.status(200).send(saved)
  } catch (err) {
    console.error('error while saving design', err)
    res.status(500).send(err)
  }
})

// error while fetching all scripts
app.get('/api/design/get_all', async (req, res, next) => {
  try {
    console.info('/api/design/get_all')

    const data = await db.getAllDesigns()
    if (!data) throw 'error while querying database'

    res.status(200).json(data)
  } catch (err) {
    console.error('error while fetching all scripts', err)
    res.status(500).send(err)
  }
})

app.get('/api/design/get/:design_id/:mode', async function (req, res, next) {
  try {
    console.info('/api/design/get/:design_id/:mode')

    const { design_id, mode } = req.params
    const data = await db.getDesign({ design_id })
    if (!data) throw ErrorWithStatus('could not fetch design', 404)

    res.json({ design: data.design[mode], modified: data.modified })
  } catch (err) {
    console.error('error while fetching design', 'could not find design')
    res.status(err.status).send(err)
  }
})

app.use('/api/uploads', express.static(__dirname + '/uploads'))
app.use('/api/designs', express.static(__dirname + '/designs'))
app.use('/api/sounds', express.static(__dirname + '/sounds'))

app.use('/api/system', express.static('system'))

app.get('/api/video/:script_id/:file_id', req => {
  const { script_id, file_id } = req.params
})
