
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
var crypto = require('crypto');
const { performance } = require('perf_hooks');
var app = express();
app.use(cors())


const redis = require("redis");
const jsonify = require('redis-jsonify')

_redis = redis.createClient();
j_redis = jsonify(_redis);

_redis.on("error", function (error) {
  console.error(error);
});

const _get = promisify(j_redis.get).bind(_redis);
const _set = promisify(j_redis.set).bind(_redis);
const _hmset = promisify(_redis.hmset).bind(_redis);
const _hget = promisify(_redis.hget).bind(_redis);
const _hdel = promisify(_redis.hdel).bind(_redis);
const _del = promisify(_redis.del).bind(_redis);


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


function testCrypto() {
  let strings = [];
  let errors = 0;
  let count = 0;


  function test() {
    let string, base;
    // setInterval(() => { console.log(`${errors} errors so far`) }, 2000);
    for (let i = 0; i < 1000; i++) {
      string = crypto.randomBytes(4).toString('hex');
      string += i;
      if (strings.indexOf(string) != -1) errors++;
      strings.push(string);
      count++;
    }
    console.log(`completed with ${errors} errors in ${count} strings`);
    setTimeout(test, 10)
  }
  test()
}

// testCrypto()

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
  // console.log(roles);
  // await _hmset('role_urls', role_urls);

  success.push(await _set(`s_${script_id}_${type}_roles`, flat(roles)));
  success.push(await _set(`s_${script_id}_${type}_instructions`, flat(instructions, { safe: true })));
  success.push(await _set(`s_${script_id}_${type}_blocks`, flat(blocks, { safe: true })));
  res.send(success.find(v => v !== "OK"));
})



/* app.get('/script/:script_id/:role_id', async function (req, res, next) {
  const script_id = req.params.script_id
  const role_id = req.params.role_id
  res.send({ script_id, role_id })
  return next();
}) */

// const nodeToBlock = (a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k.replace('node', 'block'), v]))

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
  // res.end();
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

// upload video
app.post('/api/uploadVideo/:script_id', function (req, res) {
  let script_path = `./uploads/${req.params.script_id}`
  if (!fs.existsSync(script_path)) {
    fs.mkdirSync(script_path);
  }
  let new_path = `${script_path}/${req.body.instruction_id}${path.extname(req.files.file.name)}`;
  fs.writeFile(new_path, req.files.file.data, (err) => {
    if (!err) res.send(new_path);
  })
})



// create room
app.post('/api/createRoom/:script_id/:type', async function (req, res, next) {
  const type = req.params.type;
  const script_id = req.params.script_id;
  let roles = await _get(`s_${script_id}_${type}_roles`);
  roles = unflatten(roles);
  let room_id = crypto.randomBytes(4).toString('hex');
  let role_data = {};
  const role_urls = {};
  const role_status = {};
  const role_orders = {};

  Object.keys(roles)
    .forEach(role_id => {
      const url = crypto.randomBytes(4).toString('hex');
      role_urls[url] = { room_id, role_id, script_id };
      role_data[role_id] = url;
      role_status[role_id] = 'start';
      role_orders[role_id] = 0;
    });
  console.log('role_urls are :', role_urls);
  await _hmset('role_urls', role_urls);
  await _hmset(`r_${room_id}`, {
    role_urls: role_data,
    role_status: role_status,
    role_orders: role_orders,
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

// join room + fetch role
app.get('/api/joinRoom/:role_url', async function (req, res, next) {
  const role_url = req.params.role_url;

  try {
    let url_data = await _hget('role_urls', role_url);
    if (!url_data) res.send(false);

    let room_id = url_data.room_id;
    let role_id = url_data.role_id;
    let script_id = url_data.script_id;

    let type = await _hget(`r_${room_id}`, 'type');
    // let script_id = await _hget(`r_${room_id}`, 'script_id');

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
    // res.json({ success: false })

  }


  /* 
  
    const script_id = req.params.script_id;
    const roles = await _get(`s_${script_id}_${type}_roles`);
    let room_id = crypto.randomBytes(4).toString('hex');
    let role_data = {};
    const role_urls = {};
    const role_status = {};
    const role_orders = {};
  
    Object.keys(roles)
      .forEach(role_id => {
        const url = crypto.randomBytes(4).toString('hex');
        role_urls[url] = { room_id, role_id, script_id };
        role_data[role_id] = url;
        role_status[role_id] = 'start';
        role_orders[role_id] = 0;
      });
    await _hmset('role_urls', role_urls);
    await _hmset(`r_${room_id}`, {
      role_urls: role_data,
      role_status: role_status,
      role_orders: role_orders,
      status: 'start'
    });
    res.json({ room_id, roles: role_urls }); */
})
