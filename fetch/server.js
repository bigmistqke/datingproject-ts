
const fs = require('fs');
const path = require('path');

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser')

const _Mqtt = require("./modules/_Mqtt.js")
const _Mongo = require('./modules/_Mongo.js');
const _Redis = require('./modules/_Redis.js');

const DatabaseManager = require('./managers/DatabaseManager.js');
const RoomManager = require('./managers/RoomManager.js');

const sharp = require('sharp');
const createPoster = require('./createPoster.js');

var app = express();
app.use(cors());
app.use(compression());
app.listen(8079);

console.log({ createPoster });

const _mongo = new _Mongo({ url: 'mongodb://localhost:27017' });
const _redis = new _Redis();
const _mqtt = new _Mqtt();

// let _db, _rooms, monitor;

let _db = new DatabaseManager({ _mongo, _redis });
let _rooms = new RoomManager({ _mongo, _redis, _mqtt });

const isDev = true;
let mqtt_url = isDev ? "localhost:8883" : "socket.datingproject.net/mqtt";
console.log('DOES THE WHOLE SCRIPT RESTART FOR SOME REASON??');

_mongo.connect('datingProject')
  .then(() => _mqtt.connect(mqtt_url, true))
  .then(() => _rooms.init())
  .catch(e => console.error('error while connecting to mongo:', e))







app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: false
}));
app.use(bodyParser.json({ limit: "50mb" }));





app.use(fileUpload());

app.get("/api/getServerTime", (req, res) => res.json({ timestamp: new Date().getTime() }))

// upload video
app.post('/api/uploadVideo/:script_id/:type', async function (req, res) {
  try {
    console.log('upload video!')
    let script_path = `./uploads/${req.params.script_id}`;
    if (!fs.existsSync(script_path)) {
      fs.mkdirSync(script_path);
    }
    let new_filename = `${req.body.instruction_id}${path.extname(req.files.file.name)}`;
    let new_path = `${script_path}/${new_filename}`;

    fs.writeFile(new_path, req.files.file.data, async (err) => {
      if (!err) {
        createPoster(new_path);
        setTimeout(() => {
          res.send(new_path);
        }, 1000)
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
  console.log('/api/script/save/:script_id')
  let script = req.body;
  const script_id = req.params.script_id;
  const result = await _db.saveScript({ script_id, script });
  res.json(result);
})

// get script
app.get('/api/script/get/:script_id/:mode', async function (req, res) {
  const { mode, script_id } = req.params;
  const start = new Date().getTime();

  let results = await _db.getScript(script_id);

  console.log('get script', script_id, new Date().getTime() - start);

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
  let { room, room_id } = await _rooms.createRoom({ script_id, script });
  // _rooms.monitor({ room_id });
  res.json({ ...room, room_id });
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
  console.log('/api/room/join/:url');
  const { url } = req.params;
  const room_id = url.slice(0, 6);
  const player_id = url.slice(6);
  console.log('joining room', new Date(), room_id, player_id);

  let join_result = await _rooms.joinRoom({ room_id, player_id });
  if (join_result.error) {
    console.error(join_result.error);
    res.status(404).send(join_result.error);
    return;
  }

  if (!join_result.sound) join_result.sound = "ping.mp3";
  if (!join_result.design_id) join_result.design_id = "oldie_3";
  let { design, modified } = await _db.getDesign({ design_id: join_result.design_id });

  _mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'connected' }));

  res.json({
    success: true,
    room_id,
    player_id,
    design: { ...design.production, modified },
    ...join_result,
  });
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
    let start = new Date().getTime();
    let rooms = await _rooms.getRooms({ script_id });
    console.log('get rooms of script_id ', script_id, ' took ', new Date().getTime() - start, 'ms');

    res.json(rooms);
  } catch (e) {
    res.json({ error: e });
  }
})

// get active rooms with certain script_id (for game-master)
app.get('/api/room/metadata/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id;
  try {
    let start = new Date().getTime();
    let rooms = await _rooms.getAllMetas({ script_id });

    console.log('get all monitor-data of script_id ', script_id, ' took ', new Date().getTime() - start, 'ms');

    res.json(rooms);
  } catch (e) {
    res.json({ error: e });
  }
})

app.get('api/room/getInstructions/:room_id/:player_id', async function (req, res, next) {
  const { room_id, player } = req.params;

  let { instructions, error } = await _rooms.getInstructions({ room_id, player_id });

  if (error) {
    console.error(error);
    res.json({ error })
  } else {
    res.json({ instructions })
  }
})

// get active rooms with certain script_id (for game-master)
/* app.get('/api/room/disconnect/:room_id/:player_id', async function (req, res, next) {
  const { room_id, player_id } = req.params;
  try {
    console.info(`${room_id} ${player_id} is disconnected`)
    let rooms = await _rooms.updateStatusOfRole({ room_id, player_id, status: 'disconnected' });

    _mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'disconnected' }));

    res.json(rooms);
  } catch (e) {
    res.json({ error: e });
  }
}) */

// get active rooms with certain script_id (for game-master)
app.get('/api/room/update/:room_id/:script_id', async function (req, res, next) {
  const room_id = req.params.room_id;
  const script_id = req.params.script_id;

  try {
    let result = await _rooms.updateScriptOfRoom({ room_id, script_id });
    res.json(result);
  } catch (error) {
    res.json({ error });
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
          const CONSTANT = 10;
          const dim = {
            width: parseInt((element.dimensions.width * (card_dimensions.width / 100)) * CONSTANT),
            height: parseInt((element.dimensions.height * (card_dimensions.height / 100)) * CONSTANT),
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
  try {
    const { design_id, mode } = req.params;
    console.log('get design with card_id ', design_id);
    let data = await _db.getDesign({ design_id });
    console.log(data);
    if (!data) {
      res.status(404).send("could not find design");
      return;
    }
    res.json({ design: data.design[mode], modified: data.modified });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }

})

app.get('/api/convertAllScripts', async function (req, res, next) {
  res.json(await _db.convertAllScripts());
})

app.use('/api/uploads', express.static(__dirname + '/uploads'));
app.use('/api/designs', express.static(__dirname + '/designs'))
app.use('/api/sounds', express.static(__dirname + '/sounds'))

app.use('/api/system', express.static('system'))

app.get('/api/video/:script_id/:file_id', () => {
  const { script_id, file_id } = req.params;
  console.log('get video', script_id, file_id);
})

