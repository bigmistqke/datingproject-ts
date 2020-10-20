const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const mysql = require('mysql');

const server = restify.createServer({
  name: 'myapp',
  version: '1.0.0'
});
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: ['*'],
  // allowHeaders: ['X-App-Version'],
  exposeHeaders: []
})

server.listen(8080, function () {
  console.log('%s listeni ng at %s', server.name, server.url);
});

server.pre(cors.preflight);
// server.use(cors.actual);
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);
const createConnection = () =>{
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'datingproject'
  });
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
  
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

server.post('/save', function (req, res, next) {
  let data = req.body;
  let sql = "INSERT INTO instructions (instruction_id, script_id, role, type, text, instruction_order) VALUES";
  data.map((row, index) => {
    console.log(row.instruction_id);
    sql += ` ('${row.instruction_id}', '${row.script_id}', '${row.role}', '${row.type}', '${escapeHtml(row.text)}', '${index}'),`
  })
  sql = sql.slice(0, -1);
  sql += ` ON DUPLICATE KEY UPDATE 
    script_id = VALUES(script_id),
    role = VALUES(role), 
    type = VALUES(type), 
    text = VALUES(text), 
    instruction_order = VALUES(instruction_order)`;

  const connection = createConnection();

  connection.connect(function (err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      res.send(err.stack);
      return;
    }
    connection.query(sql, function (error, results, fields) {
      if (error) throw error;
      let response;
      if (error) {
        response = JSON.stringify(error);
      } else {
        response = true;
      }
      res.send(response);
      connection.end();
    });
  });
  return next();
});

server.get('/script/:script_id', function (req, res, next) {
  const script_id = req.params.script_id

  const connection = createConnection();

  connection.connect(function (err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      res.send(err.stack);
      return;
    }
    connection.query(`SELECT * FROM instructions WHERE script_id='${script_id}'`, function (error, results, fields) {
      if (error) throw error;
      results.sort((a, b) => parseFloat(a.instruction_order) - parseFloat(b.instruction_order));
      res.send(results);

      connection.end();
    });
  });
  return next();
})

server.get('/scripts', function (req, res, next) {

  const connection = createConnection();

  connection.connect(function (err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      res.send(err.stack);
      return;
    }
    connection.query(`SELECT DISTINCT script_id FROM instructions`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
      connection.end();
    });
  });
  return next();
})