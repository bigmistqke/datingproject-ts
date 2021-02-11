// const restify = require('restify');
// const corsMiddleware = require('restify-cors-middleware');




const mysql = require('promise-mysql');
const flat = require('flat');
var unflatten = require('flat').unflatten;
const promisify = require('util').promisify;
const multer = require('multer');
/* 
const upload = multer(); */
var formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const resolve = path.resolve

const express = require('express');
const fileUpload = require('express-fileupload');
const http = require('http');
var cors = require('cors')

var app = express();
app.use(cors())
app.use(fileUpload());

const redis = require("redis");
const jsonify = require('redis-jsonify')

_redis = jsonify(redis.createClient());
_redis.on("error", function (error) {
  console.error(error);
});

const _get = promisify(_redis.get).bind(_redis);
const _set = promisify(_redis.set).bind(_redis);


app.listen(8080);



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


app.post('/save', async function (req, res, next) {
  let { blocks, roles, instructions, script_id } = JSON.parse(req.body);
  let _roles = {};
  await _set(`${script_id}_roles`, flat(roles, { safe: true }));
  _set(`${script_id}_instructions`, flat(instructions));
  _set(`${script_id}_blocks`, flat(blocks));
  _set(`${script_id}_roles`, flat(roles));
})


app.get('/script/:script_id/:role_id', async function (req, res, next) {
  const script_id = req.params.script_id
  const role_id = req.params.role_id
  res.send({ script_id, role_id })
  return next();
})

const nodeToBlock = (a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k.replace('node', 'block'), v]))

app.get('/script/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id
  let data = {}
  let blocks = await _get(`${script_id}_blocks`);
  if (!blocks) {
    res.send(false);
    return next();
  }
  blocks = nodeToBlock(blocks);
  blocks = Object.values(unflatten(blocks));
  let instructions = await _get(`${script_id}_instructions`);
  instructions = nodeToBlock(instructions);
  instructions = unflatten(instructions);
  let roles = await _get(`${script_id}_roles`);
  roles = unflatten(roles);
  res.send({ roles, blocks, instructions });
  return next();
})

app.get('/scripts', function (req, res, next) {
  createConnection().then(connection => {
    connection.query(`SELECT DISTINCT script_id FROM instructions`).then(result => {
      res.send(results);
      connection.end();
    })
  })
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

app.post('/saveImage', function (req, res) {
  console.log(req.body); // the uploaded file object

  let script_path = `/uploads/${req.body.script_id}`

  if (!fs.existsSync(script_path)) {
    fs.mkdirSync(script_path);
  }

  let new_path = `${script_path}/${req.body.instruction_id}${path.extname(req.files.file.name)}`;
  fs.writeFile(new_path, req.files.file.data, (err) => {
    console.log(err);
    if (!err) res.send(JSON.stringify(resolve(new_path)));
  })
})