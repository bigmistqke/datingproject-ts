/* 
const flat = require('flat');
var unflatten = require('flat').unflatten;
const promisify = require('util').promisify; */
const fs = require('fs');
const path = require('path');

const DatabaseManager = require('./DatabaseManager.js');

const express = require('express');
const fileUpload = require('express-fileupload');
var cors = require('cors')
var bodyParser = require('body-parser')

var app = express();
app.use(cors())
app.listen(8080);
app.use('/api/uploads', express.static('uploads'))
app.use('/api/system', express.static('system'))




const _db = new DatabaseManager({ mongo_url: 'mongodb://localhost:27017' });

// const test = async () => {
//   console.log('test');
//   let { room_url, room } = await _db.createRoom({ script_id: 'barleon' });
//   // console.log(room_url, Object.keys(room));
//   /*  let { role_id, instructions, error } = await _db.joinRoom({ room_url: room_url, role_url: Object.keys(room)[0] });
//    console.log(error); */

// }
_db.init().then(() => {
  console.info('connection made with mongodb');
})



app.use(bodyParser.json())

// save script
app.post('/api/save/:script_id', async function (req, res, next) {
  let { blocks, roles, instructions } = req.body;
  const script_id = req.params.script_id;
  const result = await _db.saveScript({ script_id, blocks, roles, instructions });
  res.json(result);
})

// get script
app.get('/api/get/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id;
  let results = await _db.getScript(script_id);
  res.send(results);
  return next();
})

// test script
app.post('/api/test/:script_id', async function (req, res, next) {
  const { script_id } = req.params;
  let script = req.body;

  let { roles, room_url, error } = await _db.testScript({ script_id, script });

  if (error) res.json({ success: false, error: error });
  res.json({ roles, room_url });
})


app.use(fileUpload());

// upload video
app.post('/api/uploadVideo/:script_id/:type', async function (req, res) {
  let script_path = `./uploads/${req.params.script_id}`;
  let type = req.params.type;

  let { blocks, roles, instructions } = req.body;

  if (!fs.existsSync(script_path)) {
    fs.mkdirSync(script_path);
  }
  let new_filename = `${req.body.instruction_id}${path.extname(req.files.file.name)}`;
  let new_path = `${script_path}/${new_filename}`;
  fs.writeFile(new_path, req.files.file.data, async (err) => {
    if (!err) {
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
  _redis.createRoom({ script_id });

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

app.get('/api/getRoleUrls/:room_url', async function (req, res, next) {
  const room_url = req.params.room_url;
  try {
    let { role_urls } = await _db.getRoleUrls({ room_url });
    console.log('get room ', role_urls, 'geetetet');

    if (!role_urls) res.send(false);

    res.json({ role_urls, room_url });

  } catch (e) {
    res.json({ error: e });

  }
})



// join room + fetch role
app.get('/api/joinRoom/:url', async function (req, res, next) {
  const { url } = req.params;
  const room_url = url.slice(0, 6);
  const role_url = url.slice(6);

  let { role_id, instructions, error } = await _db.joinRoom({ room_url, role_url });

  if (error) {
    console.error('errrrrr', error);
    res.json({ success: false, error: error })
  };
  res.json({ role_id, instructions, room_url, role_url });
  // res.json(JSON.stringify());
})
