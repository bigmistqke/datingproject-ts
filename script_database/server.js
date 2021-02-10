const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const mysql = require('promise-mysql');
const flat = require('flat');
var unflatten = require('flat').unflatten

const server = restify.createServer({
  name: 'myapp',
  version: '1.0.0'
});
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

const redis = require("redis");
const jsonify = require('redis-jsonify')

_redis = jsonify(redis.createClient());
_redis.on("error", function (error) {
  console.error(error);
});


var cors = corsMiddleware({
  preflightMaxAge: 5,
  origins: ['*'],
  allowHeaders: ['Range'],
  exposeHeaders: []
});

server.listen(8080, function () {
  console.log('%s listeni ng at %s', server.name, server.url);
});

// maybe you have to change according to local
server.pre(cors.preflight);
server.use(cors.actual);

/* server.use(
  function crossOrigin(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
); */
const createConnection = async () => {
  var connection = await mysql.createConnection({
    host: 's221.webhostingserver.nl',
    port: '3306',
    user: 'deb120261_datingproject',
    password: 'Shitfuck1!',
    database: 'deb120261_datingproject'
  });
  await connection.connection;
  return connection;
}

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

server.get("/", function (req, res, next) {
  console.log("hallo");
  res.send("hallo!");
  return next();
})

const deleteAllTablesWithScriptId = async (connection, script_id) => {
  let errors = [];
  const attemptQuery = async (sql) => {
    try { let query = await connection.query(sql) }
    catch (err) { errors.push(err) };
  }
  // remove all instructions from database
  let sql = `DELETE FROM instructions WHERE script_id=${script_id}`;
  await attemptQuery(sql);
  sql = `DELETE FROM nodes WHERE script_id=${script_id}`;
  await attemptQuery(sql);
  sql = `DELETE FROM connections WHERE script_id=${script_id}`;
  await attemptQuery(sql);
  sql = `DELETE FROM roles WHERE script_id=${script_id}`;
  await attemptQuery(sql);
  return errors;
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


server.post('/save', async function (req, res, next) {
  let { nodes, roles, instructions, script_id } = JSON.parse(req.body);

  // synthesize array of instruction_ids per role

  let _roles = {};
  roles.forEach(r => {
    _roles[r.role_id] = {}
    _roles[r.role_id].instructions = instructions.filter(i => i.role_id === r.role_id);
    _roles[r.role_id].instructions.sort((a, b) => a.instruction_order_role > b.instruction_order_role);
    _roles[r.role_id].instructions = _roles[r.role_id].instructions.map(v => v.instruction_id);
  })

  _redis.set(`${script_id}_roles`, flat(_roles));

  instructions = instructions.map(v =>
    Object.fromEntries(
      Object.entries(v).filter(([k, v]) => ["script_id", "node_id", "instruction_order_node", "instruction_order_role", "index"].indexOf(k) === -1))
  )

  console.log(instructions);
  instructions = convertArrayToObject(instructions, "instruction_id");

  _redis.set(`${script_id}_instructions`, flat(instructions), () => {
    _redis.get(`${script_id}_instructions`, (err, data) => {
      // console.log('get that data', unflatten(data));
    })
  });

  _redis.set(`${script_id}_blocks`, flat(nodes), () => {
    _redis.get(`${script_id}_blocks`, (err, data) => {
      // console.log('get that data', unflatten(data));
    })
  });

  // 
  /* _redis.rpush(`${script_id}_nodes`, nodes);
  _redis.rpush(`${script_id}_roles`, roles); */
  // 

})

/* server.post('/save', async function (req, res, next) {
  const attemptQuery = async (sql, type) => {
    try { let query = await connection.query(sql) }
    catch (err) { errors[type] = err };
  }

  console.log("SAAAAAAAAAAAAAAAVE");

  let data = JSON.parse(req.body);
  let nodes = data.nodes;
  let roles = data.roles;

  let instructions = data.instructions;
  let script_id = data.script_id;

  let errors = {};



  // connect
  let connection = await createConnection();

  // reset all
  let delete_errors = await deleteAllTablesWithScriptId(connection, script_id);
  if (delete_errors.length > 0) errors.deleting = delete_errors;

  // insert instructions
  let parameters = ['script_id', 'role_id', 'instruction_id', 'type', 'text', 'node_id', 'instruction_order_role', 'instruction_order_node', 'next_instruction_id', 'prev_instruction_id'];
  let parameters_string = parameters.join(', ');

  console.log(data.instructions);

  let sql = `INSERT INTO instructions (${parameters_string}) VALUES`;
  sql += data.instructions.map((instruction, index) => `(${parameters.map(v => instruction[v]).map(v => v ? `'${v}'` : 'NULL').join(`, `)})`).join(`, 
  `);
  // console.log(sql);
  await attemptQuery(sql, 'instructions inserting');

  // insert nodes
  parameters_string = ['script_id', 'node_id', 'x', 'y'].join(', ');

  sql = `INSERT INTO nodes (${parameters_string}) VALUES`;
  sql += nodes.map(node => {
    return `(${[script_id, node.node_id, node.position.x, node.position.y].map(v => v ? `'${v}'` : 'NULL').join(', ')})`;
  }).join(', ');

  await attemptQuery(sql, 'nodes inserting');


  // insert connections
  parameters_string = ['script_id', 'node_id', 'role_id', 'prev_node_id', 'next_node_id'].join(', ');

  sql = `INSERT INTO connections (${parameters_string}) VALUES`;
  sql += nodes.map(node => {
    return node.connections.map(connection => {
      return `(${[script_id, node.node_id, connection.role_id, connection.prev_node_id, connection.next_node_id]
        .map(v => v ? `'${v}'` : 'NULL').join(', ')})`
    }).join(', ');
  }).join(', ');
  console.log(sql);
  await attemptQuery(sql, 'connections inserting');

  // insert roles
  parameters = ['script_id', 'role_id'];
  parameters_string = parameters.join(', ');

  sql = `INSERT INTO roles (${parameters_string}) VALUES`;
  sql += roles.map(role => {
    return `(${[script_id, role.role_id].map(v => `'${v}'`).join(', ')})`;
  }).join(', ');
  await attemptQuery(sql, 'roles inserting');


  // delete all roles

  res.send(errors);
  connection.end();


  return next();
}); */

// server.get('/hashmap', async function (req, res, next) {
//   let connection = await createConnection();
//   let instructions = await connection.query(`SELECT role_id, instruction_id FROM instructions`);
//   let hashmap = {};
//   instructions.forEach(instruction => {
//     let script_id = instruction.script_id;
//     let role_id = instruction.role_id;

//     if (!(script_id in hashmap))
//       hashmap[script_id] = {};
//     /*     if (!(role_id in hashmap[script_id]))
//           hashmap[script_id][role_id] = []; */

//     hashmap[script_id][instruction.instruction_id] = role_id;

//   })
//   console.log(hashmap);
//   res.send({ hashmap });
// })

server.get('/play/:script_id/:role_id', async function (req, res, next) {
  const script_id = req.params.script_id
  const role_id = req.params.role_id

  let connection = await createConnection();
  // let roles = await connection.query(`SELECT role_id FROM roles WHERE script_id='${script_id}' AND role_id='${role_id}'`);
  // roles = roles.map(v => { return { role_id: v.role_id } });

  // for (let role of roles) {
  let instructions = await connection.query(`SELECT * FROM instructions WHERE script_id='${script_id}' AND role_id='${role_id}'`);
  instructions = instructions.sort((a, b) => (a.instruction_order_role > b.instruction_order_role) ? 1 : -1);
  // role.instructions = instructions;
  // }

  res.send({ instructions });

  connection.end();

  return next();
})

server.get('/script/:script_id/:role_id', async function (req, res, next) {
  const script_id = req.params.script_id
  const role_id = req.params.role_id
  console.log("THIS YES!!", script_id, role_id);
  res.send({ script_id, role_id })


  /*   let connection = await createConnection();
    let nodes = await connection.query(`SELECT node_id, x, y FROM nodes WHERE script_id='${script_id}'`);
    nodes = nodes.map(v => { return { node_id: v.node_id, position: { x: v.x, y: v.y }, connections: [], instructions: [] } });
  
    for (let node of nodes) {
      let instructions = await connection.query(`SELECT * FROM instructions WHERE script_id='${script_id}' AND node_id='${node.node_id}'`);
      instructions = instructions.sort((a, b) => (a.instruction_order_node > b.instruction_order_node) ? 1 : -1);
      node.instructions = instructions;
      let connections = await connection.query(`SELECT role_id, node_id, prev_node_id, next_node_id, script_id FROM connections WHERE script_id='${script_id}' AND node_id='${node.node_id}'`);
      node.connections = connections;
    }
  
    let role_infos = await connection.query(`SELECT role_id FROM roles WHERE script_id='${script_id}'`);
  
    res.send({ roles: role_infos, nodes: nodes });
  
    connection.end(); */

  return next();
})

server.get('/script/:script_id', async function (req, res, next) {
  const script_id = req.params.script_id
  console.log("NOT NONONONO!!");



  let connection = await createConnection();
  let nodes = await connection.query(`SELECT node_id, x, y FROM nodes WHERE script_id='${script_id}'`);
  nodes = nodes.map(v => { return { node_id: v.node_id, position: { x: v.x, y: v.y }, connections: [], instructions: [] } });

  for (let node of nodes) {
    let instructions = await connection.query(`SELECT * FROM instructions WHERE script_id='${script_id}' AND node_id='${node.node_id}'`);
    instructions = instructions.sort((a, b) => (a.instruction_order_node > b.instruction_order_node) ? 1 : -1);
    node.instructions = instructions;
    let connections = await connection.query(`SELECT role_id, node_id, prev_node_id, next_node_id, script_id FROM connections WHERE script_id='${script_id}' AND node_id='${node.node_id}'`);
    node.connections = connections;
  }

  let role_infos = await connection.query(`SELECT role_id FROM roles WHERE script_id='${script_id}'`);

  res.send({ roles: role_infos, nodes: nodes });

  connection.end();

  return next();
})

server.get('/scripts', function (req, res, next) {

  createConnection().then(connection => {
    connection.query(`SELECT DISTINCT script_id FROM instructions`).then(result => {
      res.send(results);
      connection.end();
    })
  })
  return next();
})