
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

const sharp = require('sharp');

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
    try {
      console.log('connect to mqtt');
      await _mqtt.connect(mqtt_url, true)
      console.log('connected to mqtt :-)');


      let urls = await _rooms.getAllRoomUrls();
      urls.map(url => url.replace('r_', '')).map(room_id => _monitor.start({ room_id }))
    } catch (e) {
      console.error(e);
    }

  }).catch(e => {
    console.error('error while connecting to mongo:', e);
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
  let script = req.body;
  const script_id = req.params.script_id;
  const result = await _db.saveScript({ script_id, script });
  res.json(result);
})

// get script
app.get('/api/script/get/:script_id/:mode', async function (req, res) {
  const { mode, script_id } = req.params;
  console.log('get script', script_id);
  let results = await _db.getScript(script_id);
  if (results) {
    res.status(200).send(results[mode])
  } else {
    res.sendStatus(404)
  }
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
  console.log('joining room', new Date(), room_id, player_id);

  let { role_id, instructions, error, design_id } = await _rooms.joinRoom({ room_id, player_id });
  if (!design_id) design_id = "oldie_3";
  let { production: design } = await _db.getDesign({ design_id });

  _mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'connected' }));

  setTimeout(() => {
    // _monitor.pingRole({ room_id, player_id });
  }, 500)

  if (error) {
    res.json({ success: false, error: error })
    return;
  };

  res.json({ success: true, role_id, instructions, room_id, player_id, design, design_id });
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

app.post('/api/design/uploadImage/:card_id/:image_id', async function (req, res, next) {
  const { card_id, image_id } = req.params;
  const card_path = `./designs/${card_id}`;
  !fs.existsSync(card_path) ? fs.mkdirSync(card_path) : null;
  const new_filename = `${image_id}${path.extname(req.files.file.name)}`;
  const new_path = `${card_path}/${new_filename}`;
  fs.writeFile(new_path, req.files.file.data, async (err) => {
    if (!err) {
      res.send(new_path);
    } else {
      res.status(500).send(err);
    }
  })
})

const uploadSvgsAsPng = ({ design_id, design }) => {
  const base_url = `./designs/${design_id}`;
  const card_dimensions = design.production.card_dimensions;
  let promises = [];

  if (!fs.existsSync(base_url)) {
    fs.mkdirSync(base_url);
  }

  Object.entries(design.production.types).forEach(
    ([type_name, type]) =>
      type.forEach(element => {

        if (element.type !== "svg") return;
        promises.push(new Promise(async (resolve) => {
          const dim = {
            width: parseInt((element.dimensions.width * card_dimensions.width / 100 * 600) / 100),
            height: parseInt((element.dimensions.height * card_dimensions.height / 100 * 600) / 100),
          };
          await sharp(Buffer.from(element.svg.normal))
            .resize(dim)
            .toFile(`${base_url}/${element.id}_normal.png`);
          await sharp(Buffer.from(element.svg.masked))
            .resize(dim)
            .toFile(`${base_url}/${element.id}_masked.png`);

          delete element.svg;
          resolve();
        }))
      })
  )
  return Promise.all(promises);
}

app.post('/api/design/save/:design_id', async function (req, res, next) {
  try {
    // TODO:  sanitize content
    const { design_id } = req.params;

    const design = req.body;

    await uploadSvgsAsPng({ design_id, design });

    console.log(design);

    let saved = await _db.saveDesign({ design_id, design })
    res.status(200).send(saved);
  } catch (err) {
    console.error(`error ${err}`);
    res.status(500).send(err)
  }

})

app.get('/api/design/get/:design_id/:mode', async function (req, res, next) {
  const { design_id, mode } = req.params;
  console.log('get design with card_id ', design_id);
  let card = await _db.getDesign({ design_id });
  if (!card) {
    res.status(404).send("could not find card");
    return;
  }
  res.json(card[mode]);
})

app.get('/api/convertAllScripts', async function (req, res, next) {
  res.json(await _db.convertAllScripts());
})

app.use('/api/uploads', express.static(__dirname + '/uploads'));
app.use('/api/designs', express.static(__dirname + '/designs'))
app.use('/api/system', express.static('system'))

app.get('/api/video/:script_id/:file_id', () => {
  const { script_id, file_id } = req.params;
  console.log('get video', script_id, file_id);
})

