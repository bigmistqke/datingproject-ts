var app = require('express')();
var cors = require('cors');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fetch = require('node-fetch');
/* io.origins('*:*');
io.origins('https://play.datingproject.net:80');*/
const e = require('express');
var uniqid = require('uniqid');

const port = 4001;
const index = require("./routes/index");

app.use(index);
app.use(cors());
// let clientsConnected = [];
let clientPairs = {};
let hashmap;

let base = 'https://fetch.datingproject.net'


async function getHashmap() {
  return await fetch(`${base}/hashmap`);
}
getHashmap()
  .then((res) => res.json())
  .then((hashmap) => {
    console.log(hashmap);
    io.on("connection", (socket) => {
      let role_id;


      const getPair = () => {
        if (!(socket.script_id in clientPairs)) { return false; }
        if (!(socket.pair_id in clientPairs[socket.script_id])) { return false; }
        return clientPairs[socket.script_id][socket.pair_id];
      }
      const getOtherClient = () => {
        const pair = getPair();
        if (!pair) return false;
        return getPair().find((client) => { return client.socket.id != socket.id });
      }

      const removeClient = () => {
        if (!socket.pair_id)
          return;
        let pair = getPair();
        // pair = pair.filter((client) => { console.log(client.socket.id); return client.socket.id !== socket.id });
        console.log(pair);
        if (pair.length == 0) {
          delete clientPairs[socket.script_id][socket.pair_id];
          return;
        }
        let otherClient = pair[0];
        console.log("disconnect>");
        otherClient.socket.emit("log", "partner disconnected");
      }

      socket.on("disconnect", () => {
        console.log("Client disconnected");
        let otherClient = getOtherClient();
        if (otherClient) { otherClient.socket.emit("partnerDisconnected", true) };
        removeClient(socket);
      });


      socket.on('playAt', (index) => {
        let otherClient = getOtherClient();
        getPair().script_index = index;
        if (!!otherClient)
          otherClient.socket.emit("playAt", index);
      })

      socket.on('nextCard', (instruction_id, next_instruction_ids) => {
        let pair = clientPairs[socket.script_id][socket.pair_id];
        next_instruction_ids.forEach(instruction_id => {
          let other_role_id = hashmap[socket.script_id][instruction_id];
          let other_socket = pair.find(v => v.role_id === other_role_id).socket;
          other_socket.emit('nextCard', instruction_id);
        })
        clientPairs[socket.script_id][socket.pair_id].find(v => v.role_id === socket.role_id).index_instructions++;
        let otherClient = getOtherClient();

        /* getPair().script_index = index;
        if (!!otherClient)
          otherClient.socket.emit("nextCard", index); */
      })


      socket.on('pairClient', function ([script_id, pair_id]) {
        if (!(script_id in clientPairs)) clientPairs[script_id] = {};
        if (!(pair_id in clientPairs[script_id])) clientPairs[script_id][pair_id] = [];

        let pair = clientPairs[script_id][pair_id];
        if (pair.length < 2) {
          socket.pair_id = pair_id;
          socket.script_id = script_id;

          let other_role_id = pair.length != 0 ? pair[0].role_id : false;
          let role_id = !other_role_id ? 'a' : other_role_id === 'a' ? 'b' : 'a';


          pair.push({ socket: socket, index: 0, role_id: role_id });
          if (pair.length == 2) {
            // pair complete
            pair[0].socket.emit("log", "partner connected");
            initPair(pair);
          } else {
            socket.emit("waitForOther", true);
          }
        } else {
          socket.emit("roomFull", true);
        }
      })

      const initPair = (pair) => {
        pair.forEach((user) => {
          user.socket.emit("initScript", { "role_id": user.role_id, "index_instructions": user.index_instructions });
          user.socket.scriptInitialized = true;
        })
      }

      const searchPair = (socket, script_id) => {
        if (!(script_id in clientPairs)) {
          clientPairs[script_id] = {};
        }
        let pairFound = Object.entries(clientPairs[script_id]).find((pair_entries) => {
          return pair_entries[1].length < 2;
        })
        return pairFound ? { pair: pairFound[1], pair_id: pairFound[0] } : false;
      }



      socket.on('findPair', function (script_id) {
        console.log("find pair");
        let role_id, script_index;
        let { pair, pair_id } = searchPair(socket, script_id);
        let index_instructions = 0;

        if (!pair || pair.length == 0) {
          role_id = "a";
          pair_id = pair ? pair_id : uniqid();
          clientPairs[script_id][pair_id] = [{ role_id, socket, index_instructions }];
          socket.emit("waitForOther", true);
        } else {
          // let foundPair = clientPairs[script_id][pair_id];
          // console.log(pair[0]);
          if (!pair[0]) console.log(pair);

          role_id = pair.length == 0 || pair[0].role_id == "a" ? "b" : "a";
          if (pair.length > 1) {
            pair[0].socket.emit("log", "partner connected");
          }
          if (pair[1]) index_instructions = pair[1].index_instructions;
          pair.push({ role_id, socket, index_instructions });
          initPair(pair);
        }
        socket.pair_id = pair_id;
        socket.script_id = script_id;
        socket.role_id = role_id;

        socket.emit("isPaired", { role_id: role_id, pair_id: pair_id, index_instructions: index_instructions });
        // console.log(clientPairs[script_id]);
      })




    });

  })


const getApiAndEmit = socket => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  io.emit("FromAPI", response);
};

let interval;




const sendClick = (socket) => {

}



http.listen(port, () => console.log(`Listening on port ${port}`));