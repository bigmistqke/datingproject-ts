
const fs = require('fs');
const path = require('path');

const _Mqtt = require("./modules/_Mqtt.js")
const _Mongo = require('./modules/_Mongo.js');
const _Redis = require('./modules/_Redis.js');

const _Monitor = require('./_Monitor.js');

// console.log('ok'why)

const _Database = require('./_Database.js');
const _Rooms = require('./_Rooms.js');
// const _Scripts = require('./_Scripts.js');

const express = require('express');
const fileUpload = require('express-fileupload');
var cors = require('cors')
var bodyParser = require('body-parser')

var app = express();
app.use(cors())
app.listen(8080);



const _mongo = new _Mongo({ url: 'mongodb://localhost:27017' });
const _redis = new _Redis();
const _mqtt = new _Mqtt();

// let _db, _rooms, monitor;

let _db = new _Database({ _mongo, _redis });
let _rooms = new _Rooms({ _mongo, _redis, _mqtt });

let _monitor = new _Monitor({ _rooms, _mqtt });


const isDev = true;
let mqtt_url = isDev ? "localhost:8883" : "socket.datingproject.net/mqtt";

_mongo.connect('datingProject')
  .then(async () => {


    await _mqtt.connect(mqtt_url, true)



    let urls = await _rooms.getAllRoomUrls();
    urls.map(url => url.replace('r_', '')).map(room_url => _monitor.start({ room_url }))
  })







app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: false
}));
app.use(bodyParser.json({ limit: "50mb" }));





app.use(fileUpload());

// upload video
app.post('/api/uploadVideo/:script_id/:type', async function (req, res) {
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
})

// access point to download video 
app.get('/api/downloadVideo/:file_name', async (req, res, next) => {
  let file_name = req.params.file_name;
  res.attachment(`/api/uploads/${file_name}`);
})

// script

// save script
app.post('/api/script/save/:script_id', async function (req, res, next) {
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
  let { room, room_url } = await _rooms.createRoom({ script, script_id });
  _monitor.start({ room_url });
  res.json({ ...room, room_url });
})

// ROOM



// create room
app.post('/api/room/create/:script_id', async function (req, res, next) {
  const { script_id } = req.params;
  const { roles, room_url, error } = await _rooms.createRoom({ script_id });
  _monitor.monitor({ room_url, roles, script_id });
  res.json({ roles, room_url, error });
})

// delete room
app.get('/api/room/delete/:room_url', async function (req, res, next) {
  try {
    const room_url = req.params.room_url;
    let response = await _rooms.deleteRoom({ room_url });
    res.send(response)
  } catch (e) {
    console.error(e);
  }
})

// restart room
app.get('/api/room/restart/:room_url', async function (req, res, next) {
  try {
    const room_url = req.params.room_url;
    let response = await _rooms.restartRoom({ room_url });

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
  const room_url = url.slice(0, 6);
  const role_url = url.slice(6);
  let { role_id, instructions, error } = await _rooms.joinRoom({ room_url, role_url });

  _mqtt.send(`/monitor/${room_url}/${role_url}/status`, JSON.stringify({ status: 'connected' }));

  setTimeout(() => {
    _monitor.pingRole({ room_url, role_url });
  }, 500)
  if (error) {
    console.error('errrrrr', error);
    res.json({ success: false, error: error })
  };

  res.json({ role_id, instructions, room_url, role_url });
})

// get all the role_urls of a room (for the combo-test)
app.get('/api/room/getRoleUrls/:room_url', async function (req, res, next) {
  const room_url = req.params.room_url;
  try {
    //console.log('get room ', room_url, 'geetetet');
    let { role_urls } = await _rooms.getRoleUrlsOfRoom({ room_url });
    if (!role_urls)
      res.send(false);
    else
      res.json({ role_urls, room_url });
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
app.get('/api/room/disconnect/:room_url/:role_url', async function (req, res, next) {
  const { room_url, role_url } = req.params;
  try {
    console.info(`${room_url} ${role_url} is disconnected`)
    let rooms = await _rooms.updateStatusOfRole({ room_url, role_url, status: 'disconnected' });

    _mqtt.send(`/monitor/${room_url}/${role_url}/status`, JSON.stringify({ status: 'disconnected' }));

    res.json(rooms);
  } catch (e) {
    res.json({ error: e });
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/update/:room_url/:script_id', async function (req, res, next) {
  const room_url = req.params.room_url;
  const script_id = req.params.script_id;

  try {
    ////console.log('get those rooms!!');
    let result = await _rooms.updateScriptOfRoom({ room_url, script_id });
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
  ////console.log('upload image!!! ', new_path);
  fs.writeFile(new_path, req.files.file.data, async (err) => {
    if (!err) {
      res.send(new_path);
    } else {
      res.status(500).send(err);
    }
  })
})

app.post('/api/card/save/:card_id', async function (req, res, next) {
  const { card_id } = req.params;
  // sanitize?
  let saved = await _db.saveCard({ card_id, card: req.body })
  ////console.log(saved);
  res.send(saved);
})

app.get('/api/card/get/:card_id', async function (req, res, next) {
  const { card_id } = req.params;
  // sanitize?
  ////console.log('get card id');
  let card = await _db.getCard({ card_id })
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
  // res.attachment(`/api/uploads/${script_id}/${file_id}`);

})

