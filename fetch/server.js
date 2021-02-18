
const flat = require('flat');
var unflatten = require('flat').unflatten;
const promisify = require('util').promisify;
const multer = require('multer');
/* 
const upload = multer(); */
const fs = require('fs');
const path = require('path');
const resolve = path.resolve

const express = require('express');
const fileUpload = require('express-fileupload');
var cors = require('cors')
var bodyParser = require('body-parser')
var uniqid = require('uniqid');

var app = express();
app.use(cors())


const redis = require("redis");
const jsonify = require('redis-jsonify')

_redis = jsonify(redis.createClient());
_redis.on("error", function (error) {
  console.error(error);
});

const _get = promisify(_redis.get).bind(_redis);
const _set = promisify(_redis.set).bind(_redis);


app.listen(8080);
app.use('/api/uploads', express.static('uploads'))
// app.use(serveStatic('uploads', {}))

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}




const convertArrayToObject = (array, key) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    let _item = Object.entries(item).filter((([k, v]) => k !== key));
    _item = Object.fromEntries(_item);
    return {
      ...obj,
      [item[key]]: _item,
    };
  }, initialValue);
};

app.use(bodyParser.json())
app.post('/api/save/:script_id/:type', async function (req, res, next) {
  let { blocks, roles, instructions } = req.body;
  const type = req.params.type;
  const script_id = req.params.script_id;

  let success = [];
  success.push(await _set(`s_${script_id}_${type}_roles`, flat(roles, { safe: true })));
  success.push(await _set(`s_${script_id}_${type}_instructions`, flat(instructions, { safe: true })));
  success.push(await _set(`s_${script_id}_${type}_blocks`, flat(blocks, { safe: true })));
  res.send(success.find(v => v !== "OK"));
})

app.post('/api/createRoom/:script_id/:type', async function (req, res, next) {
  const type = req.params.type;
  const script_id = req.params.script_id;
  const roles = await _get(`s_${script_id}_${type}_roles`);
  let _roles = {};
  let room_id = uniqid.time();
  Object.keys(roles)
    .forEach(role_id => _roles[role_id] = uniqid.time())
  await _set(`r_${script_id}_${type}_${room_id}`, flat(_roles, { safe: true }));
  res.json({ room_id, roles: _roles });
})

app.get('/script/:script_id/:role_id', async function (req, res, next) {
  const script_id = req.params.script_id
  const role_id = req.params.role_id
  res.send({ script_id, role_id })
  return next();
})

// const nodeToBlock = (a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k.replace('node', 'block'), v]))

app.get('/script/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id
  let data = {}
  let blocks = await _get(`s_${script_id}_temp_blocks`);
  if (!blocks) {
    res.send(false);
    return next();
  }
  // blocks = nodeToBlock(blocks);
  blocks = Object.values(unflatten(blocks));
  let instructions = await _get(`s_${script_id}_temp_instructions`);
  // instructions = nodeToBlock(instructions);
  instructions = unflatten(instructions);
  let roles = await _get(`s_${script_id}_temp_roles`);
  roles = unflatten(roles);
  res.send({ roles, blocks, instructions });
  return next();
})



var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});
var upload = multer({ storage: storage }).single();


app.use(fileUpload());
app.post('/api/uploadVideo', function (req, res) {
  console.log(req.body); // the uploaded file object

  let script_path = `./uploads/${req.body.script_id}`

  if (!fs.existsSync(script_path)) {
    fs.mkdirSync(script_path);
  }

  let new_path = `${script_path}/${req.body.instruction_id}${path.extname(req.files.file.name)}`;
  console.log(new_path);
  fs.writeFile(new_path, req.files.file.data, (err) => {
    console.log(err);
    if (!err) res.send(JSON.stringify(new_path));
  })
})