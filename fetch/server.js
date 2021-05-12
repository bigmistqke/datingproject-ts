
const flat = require('flat');
var unflatten = require('flat').unflatten;
const promisify = require('util').promisify;
const fs = require('fs');
const path = require('path');

const express = require('express');
const fileUpload = require('express-fileupload');
var cors = require('cors')
var bodyParser = require('body-parser')
var crypto = require('crypto');

var app = express();
app.use(cors())
app.listen(8080);
app.use('/api/uploads', express.static('uploads'))
app.use('/api/system', express.static('system'))



const redis = require("redis");
const jsonify = require('redis-jsonify')

_redis = redis.createClient();
j_redis = jsonify(_redis);

console.log("START EXPRESS!!");

_redis.on("error", function (error) {
  console.error(error);
});

const _get = promisify(j_redis.get).bind(_redis);
const _set = promisify(j_redis.set).bind(_redis);
const _hmset = promisify(_redis.hmset).bind(_redis);
const _hget = promisify(_redis.hget).bind(_redis);
const _hdel = promisify(_redis.hdel).bind(_redis);
const _del = promisify(_redis.del).bind(_redis);



app.use(bodyParser.json())

// save script
app.post('/api/save/:script_id/:type', async function (req, res, next) {
  let { blocks, roles, instructions } = req.body;
  const type = req.params.type;
  const script_id = req.params.script_id;

  let success = [];

  success.push(await _set(`s_${script_id}_${type}_roles`, flat(roles)));
  success.push(await _set(`s_${script_id}_${type}_instructions`, flat(instructions, { safe: true })));
  success.push(await _set(`s_${script_id}_${type}_blocks`, flat(blocks, { safe: true })));
  res.send(success.find(v => v !== "OK"));
})

// get script
app.get('/api/get/:script_id/:type', async function (req, res, next) {
  const script_id = req.params.script_id;
  const type = req.params.type

  let data = {}
  let blocks = await _get(`s_${script_id}_temp_blocks`);
  if (!blocks) {
    res.send(false);
    return next();
  }
  blocks = Object.values(unflatten(blocks));
  let instructions = await _get(`s_${script_id}_temp_instructions`);
  instructions = unflatten(instructions);
  let roles = await _get(`s_${script_id}_temp_roles`);
  roles = unflatten(roles);
  res.send({ roles, blocks, instructions });
  return next();
})


app.use(fileUpload());

// upload video
app.post('/api/uploadVideo/:script_id/:type', async function (req, res) {
  let script_path = `./uploads/${req.params.script_id}`;
  let type = req.params.type;

  if (!fs.existsSync(script_path)) {
    fs.mkdirSync(script_path);
  }
  let new_filename = `${req.body.instruction_id}${path.extname(req.files.file.name)}`;
  let new_path = `${script_path}/${new_filename}`;
  fs.writeFile(new_path, req.files.file.data, async (err) => {
    if (!err) {
      // let addedToQueue = await fetch(`https://localhost:8088/video/convert/hls/${new_filename}`)
      res.send(new_path);
    }
  })
})

// access point to download video 
app.get('/api/downloadVideo/:file_name', async (req, res, next) => {
  let file_name = req.params.file_name;
  res.attachment(`/api/uploads/${file_name}`);
})

// create room
app.post('/api/createRoom/:script_id/:type', async function (req, res, next) {
  const type = req.params.type;
  const script_id = req.params.script_id;
  let roles = await _get(`s_${script_id}_${type}_roles`);
  roles = unflatten(roles);
  let room_id = crypto.randomBytes(4).toString('hex');
  let role_data = {};
  // hashmap: urls of the actor/role of the room - role_id, script_id, room_id
  const role_urls = {};
  // keeping track of where in the game the actor is
  const role_status = {};

  console.log(roles);

  Object.keys(roles)
    .forEach(role_id => {
      console.log('make role url for ', role_id);
      const url = crypto.randomBytes(4).toString('hex');
      role_urls[url] = { room_id, role_id, script_id };
      role_data[role_id] = url;
      role_status[role_id] = 'start';

    });
  console.log('role_urls are :', role_urls);
  await _hmset('role_urls', role_urls);
  await _hmset(`r_${room_id}`, {
    role_urls: role_data,
    role_status: role_status,
    status: 'start',
    type: type,
    script_id: script_id
  });
  res.json({ room_id, role_data });
})

// delete room
app.get('/api/deleteRoom/:room_id', async function (req, res, next) {
  try {
    const room_id = req.params.room_id;
    console.log();
    const role_urls = await _hget(`r_${room_id}`, 'role_urls');
    Object.values(role_urls).forEach(async (role_url) => {
      await _hdel(`role_urls`, role_url);
    })
    await _del(`r_${room_id}`);
    res.send(true)
  } catch (e) {
    console.error(e);
  }

})

app.get('/api/getRolesRoom/:room_id', async function (req, res, next) {
  const room_id = req.params.room_id;
  console.log('getRolesRoom', room_id);
  try {
    let room_data = await _hget(`r_${room_id}`, 'role_urls');
    if (!room_data) res.send(false);
    console.log('room_data', room_data);

    res.json(room_data);
  } catch (e) {

  }
})

// join room + fetch role
app.get('/api/joinRoom/:role_url', async function (req, res, next) {
  const role_url = req.params.role_url;

  try {

    let url_data = await _hget('role_urls', role_url);
    console.log('testing', url_data);
    if (!url_data || !('room_id' in url_data)) res.send(false);

    let room_id = url_data.room_id;
    let role_id = url_data.role_id;
    let script_id = url_data.script_id;

    let type = await _hget(`r_${room_id}`, 'type');

    let base = `s_${script_id}_${type}`;
    let role_cards = unflatten(await _get(`${base}_roles`));
    role_cards = role_cards[role_id];
    let instructions = unflatten(await _get(`${base}_instructions`));

    instructions = role_cards.map(v => {
      return {
        ...instructions[v],
        instruction_id: v
      }
    });

    res.json({ instructions, room_id, role_id })
  } catch (e) {
    console.log(e);
    res.json({ success: false })
  }
})
