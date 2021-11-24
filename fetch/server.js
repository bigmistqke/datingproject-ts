
const fs = require('fs');
const path = require('path');

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors')
const bodyParser = require('body-parser')

const _Mqtt = require("./modules/_Mqtt.js")
const _Mongo = require('./modules/_Mongo.js');
const _Redis = require('./modules/_Redis.js');

const Monitor = require('./Monitor.js');

const DatabaseManager = require('./managers/DatabaseManager.js');
const RoomManager = require('./managers/RoomManager.js');


var app = express();
app.use(cors())
app.listen(8079);

const _mongo = new _Mongo({ url: 'mongodb://localhost:27017' });
const _redis = new _Redis();
const _mqtt = new _Mqtt();

// let _db, _rooms, monitor;

let _db = new DatabaseManager({ _mongo, _redis });
let _rooms = new RoomManager({ _mongo, _redis, _mqtt });

let _monitor = new Monitor({ _rooms, _mqtt });


const isDev = true;
let mqtt_url = isDev ? "localhost:8883" : "socket.datingproject.net/mqtt";
console.log('DOES THE WHOLE SCRIPT RESTART FOR SOME REASON??');

_mongo.connect('datingProject')
  .then(async () => {

    await _mqtt.connect(mqtt_url, true)



    let urls = await _rooms.getAllRoomUrls();
    urls.map(url => url.replace('r_', '')).map(room_id => _monitor.start({ room_id }))
  })







app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: false
}));
app.use(bodyParser.json({ limit: "50mb" }));





app.use(fileUpload());

// upload video
app.post('/api/uploadVideo/:script_id/:type', async function (req, res) {
  try {
    console.log('upload video!')
    let script_path = `./uploads/${req.params.script_id}`;
    let type = req.params.type;
    let { blocks, roles, instructions } = req.body;
    if (!fs.existsSync(script_path)) {
      fs.mkdirSync(script_path);
    }
    let new_filename = `${req.body.instruction_id}${path.extname(req.files.file.name)}`;
    let new_path = `${script_path}/${new_filename}`;
    console.log('write the file:', new_path);

    fs.writeFile(new_path, req.files.file.data, async (err) => {
      if (!err) {
        res.send(new_path);
      } else {
        res.send(err);
      }
    })
  } catch (e) {
    console.error('an error happened while trying to upload a video: ', e)
  }

})

// access point to download video 
app.get('/api/downloadVideo/:file_name', async (req, res, next) => {
  let file_name = req.params.file_name;
  res.attachment(`/api/uploads/${file_name}`);
})

// script

// save script
app.post('/api/script/save/:script_id', async function (req, res, next) {
  // TODO:  sanitize content
  let { blocks, roles, instructions } = req.body;
  const script_id = req.params.script_id;
  const result = await _db.saveScript({ script_id, blocks, roles, instructions });
  res.json(result);
})

// get script
app.get('/api/script/get/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id;
  let results = await _db.getScript(script_id);
  res.send(results);
  return next();
})

// test script

// test script
app.post('/api/script/test/:script_id', async function (req, res, next) {
  const { script_id } = req.params;
  let script = req.body;
  let { room, room_id } = await _rooms.createRoom({ script, script_id });
  _monitor.start({ room_id });
  res.json({ ...room, room_id });
})

// ROOM



// create room
app.post('/api/room/create/:script_id', async function (req, res, next) {
  const { script_id } = req.params;
  const { roles, room_id, error } = await _rooms.createRoom({ script_id });
  _monitor.monitor({ room_id, roles, script_id });
  res.json({ roles, room_id, error });
})

// delete room
app.get('/api/room/delete/:room_id', async function (req, res, next) {
  try {
    const room_id = req.params.room_id;
    let response = await _rooms.deleteRoom({ room_id });
    res.send(response)
  } catch (e) {
    console.error(e);
  }
})

// restart room
app.get('/api/room/restart/:room_id', async function (req, res, next) {
  try {
    const room_id = req.params.room_id;
    let response = await _rooms.restartRoom({ room_id });

    res.send(response)
  } catch (e) {
    console.error(e);
  }
})

// status room
app.get('/api/room/status', async function (req, res, next) {
  try {
    //console.log('this works somehow!!!');
  } catch (e) {
    console.error(e);
  }
})

// join room + fetch role
app.get('/api/room/join/:url', async function (req, res, next) {
  const { url } = req.params;
  const room_id = url.slice(0, 6);
  const player_id = url.slice(6);
  console.log('joining room', room_id, player_id);

  let { role_id, instructions, error, design_id } = await _rooms.joinRoom({ room_id, player_id });

  _mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'connected' }));

  setTimeout(() => {
    // _monitor.pingRole({ room_id, player_id });
  }, 500)

  if (error) {
    res.json({ success: false, error: error })
    return;
  };

  let design = await _db.getDeck({ design_id })

  res.json({ success: true, role_id, instructions, room_id, player_id, design });
})

// get all the player_ids of a room (for the combo-test)
app.get('/api/room/getRoleUrls/:room_id', async function (req, res, next) {
  const room_id = req.params.room_id;
  try {
    //console.log('get room ', room_id, 'geetetet');
    let { player_ids } = await _rooms.getRoleUrlsOfRoom({ room_id });
    if (!player_ids)
      res.send(false);
    else
      res.json({ player_ids, room_id });
  } catch (e) {
    res.json({ error: e });
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/getRooms/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id;
  try {
    ////console.log('get those rooms!!');
    let rooms = await _rooms.getRooms({ script_id });
    res.json(rooms);
  } catch (e) {
    res.json({ error: e });
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/disconnect/:room_id/:player_id', async function (req, res, next) {
  const { room_id, player_id } = req.params;
  try {
    console.info(`${room_id} ${player_id} is disconnected`)
    let rooms = await _rooms.updateStatusOfRole({ room_id, player_id, status: 'disconnected' });

    _mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'disconnected' }));

    res.json(rooms);
  } catch (e) {
    res.json({ error: e });
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/update/:room_id/:script_id', async function (req, res, next) {
  const room_id = req.params.room_id;
  const script_id = req.params.script_id;

  try {
    let result = await _rooms.updateScriptOfRoom({ room_id, script_id });
    res.json(result);
  } catch (e) {
    res.json({ error: e });
  }
})

// CARD

app.post('/api/card/uploadImage/:card_id/:image_id', async function (req, res, next) {
  let { card_id, image_id } = req.params;
  let card_path = `./cards/${card_id}`;
  !fs.existsSync(card_path) ? fs.mkdirSync(card_path) : null;
  let new_filename = `${image_id}${path.extname(req.files.file.name)}`;
  let new_path = `${card_path}/${new_filename}`;
  fs.writeFile(new_path, req.files.file.data, async (err) => {
    if (!err) {
      res.send(new_path);
    } else {
      res.status(500).send(err);
    }
  })
})

app.post('/api/card/save/:card_id', async function (req, res, next) {
  // TODO:  sanitize content
  const { card_id } = req.params;
  let saved = await _db.saveDeck({ card_id, design: req.body })
  res.send(saved);
})

app.get('/api/design/get/:card_id', async function (req, res, next) {
  const { card_id } = req.params;
  let card = await _db.getDeck({ card_id })
  res.json(card);
})

app.get('/api/convertAllScripts', async function (req, res, next) {
  res.json(await _db.convertAllScripts());
})

app.use('/api/uploads', express.static(__dirname + '/uploads'))
app.use('/api/system', express.static('system'))
app.use('/api/cards', express.static('cards'))

app.get('/api/video/:script_id/:file_id', () => {
  const { script_id, file_id } = req.params;
  console.log('get video', script_id, file_id);
})

