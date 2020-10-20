var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, { origins: '*:*' });
var uniqid = require('uniqid');

const port = process.env.PORT || 4001;
const index = require("./routes/index");

app.use(index);

// let clientsConnected = [];
let clientPairs = {};

const getApiAndEmit = socket => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  io.emit("FromAPI", response);
};

let interval;

const findPair = (socket, script_id) => {
  if (!(script_id in clientPairs)) {
    clientPairs[script_id] = {};
  }
  let pairFound = Object.entries(clientPairs[script_id]).find((pair_entries)=>{
    return pair_entries[1].length != 2;
  })
  pair_id = pairFound ? pairFound[0] : uniqid();
  role_id = "a";
  let script_index = 0;
  if(pairFound){
    pairFound = clientPairs[script_id][pair_id];
    role_id = pairFound[0].role_id == "a" ? "b" : "a";
    pairFound.sockets.push(socket);
    script_index = pairFound.script_index;
  }else{
    clientPairs[script_id][pair_id] = {script_index: 0, sockets: [socket]};
  }
  socket.pair_id = pair_id;
  socket.script_id = script_id;
  socket.role_id = role_id;
  socket.emit("isPaired", {role_id: role_id, pair_id: pair_id, script_index: script_index});
  return pair_id;
}


const sendClick = (socket) => {

}


io.on("connection", (socket) => {
  const getPair = () => {
    console.log(clientPairs);
    console.log(socket.script_id, socket.pair_id);
    return clientPairs[socket.script_id][socket.pair_id];
  }
  const getOtherClient = () => {
    console.log(socket.script_id, socket.pair_id);
    return getPair().sockets.find((client) => { return client.id != socket.id });
  }

  const removeClient = () => {
    if(!socket.pair_id)
      return;
    console.log(clientPairs);
    console.log(getPair());
    clientPairs[socket.script_id][socket.pair_id].sockets = getPair().sockets.filter((client) => { return client.id !== socket.id });
    let pair = getPair();
    console.log("PAIR ISSS!!!");
    console.log(pair);
    if (pair.sockets.length > 0) {
      let otherClient = pair.sockets[0];
      otherClient.emit("otherGone", "other dude left " + otherClient.id);
    } else {
      delete clientPairs[socket.script_id][socket.pair_id];
    }
    console.log(clientPairs);
  }
  

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    removeClient(socket);
  });

  socket.on('playAt', (index)=>{
    let otherClient = getOtherClient();
    getPair().script_index = index;
    console.log("playNext "+ index);
    otherClient.emit("playAt", index);
  })


  socket.on('pairClient', function([script_id, pair_id]){
    console.log(script_id, pair_id);
    if(!clientPairs[script_id]){
      clientPairs[script_id] = {};
    }
    if(!clientPairs[script_id][pair_id]){
      clientPairs[script_id][pair_id] = {sockets: [], script_index: 0};
    }
    let pair = clientPairs[script_id][pair_id];

    console.log(pair);
    
    if(pair.sockets.length < 2){
      socket.pair_id = pair_id;
      socket.script_id = script_id;

      let otherRole_id = pair.sockets.length != 0 ? pair.sockets[0].role_id : false;
      console.log("OTHER ROLE IS" + otherRole_id);
      if(typeof otherRole_id === "string"){
        console.log(otherRole_id == "a" ? "b" : "a");
        socket.role_id = otherRole_id == "a" ? "b" : "a";
      }else{
        console.log("that happens");

        socket.role_id = "a";
      }
      pair.sockets.push(socket);
      console.log(socket.role_id);
      console.log(socket.role_id);
      socket.emit("initScript", {"role_id": socket.role_id, "script_index": pair.script_index});
    }else{
      console.log(false);
    }


  })

  socket.on('findPair', function (script_id) {
    //console.log(script_id);
    pair_id = findPair(socket, script_id);


  })




});

http.listen(port, () => console.log(`Listening on port ${port}`));