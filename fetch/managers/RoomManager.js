var crypto = require('crypto');
const { array_remove_element } = require('../helpers/Pure.js');
var Q = require('../Q2.js');

Object.filter = (obj, predicate) =>
  Object.keys(obj)
    .filter(key => predicate(key))
    .reduce((res, key) => (res[key] = obj[key], res), {});

function RoomManager({ _redis, _mongo, _mqtt }) {
  let rooms = {};

  let queue = new Q();
  let process = (func) => queue.add(func);

  this.init = async () => {
    let room_ids = await this.getAllRoomIds();
    console.log("ROOM_IDS", room_ids);
    room_ids.forEach(room_id => {

      if (!rooms[room_id]) {
        rooms[room_id] = new Room({ _redis, _mongo, _mqtt });
        rooms[room_id].setRoomId(room_id);
        rooms[room_id].monitor()
      }
    })
  }

  this.createRoom = async ({ script, script_id }) => {
    const new_room = new Room({ _redis, _mongo, _mqtt });
    const { room_id, role_ids } = await new_room.create({ script, script_id });
    rooms[room_id] = new_room;

    await process(async () => {
      let _rooms = await _redis.get("rooms");

      if (!_rooms) _rooms = {};
      if (!_rooms[script_id]) _rooms[script_id] = [];

      _rooms[script_id].push(room_id);
      await _redis.set("rooms", _rooms);
    })

    return { room_id, role_ids };
  }

  this.renameRoom = ({ script_id, room_id, room_name }) => rooms[room_id].setRoomName(room_name)

  this.joinRoom = ({ room_id, player_id }) =>
    rooms[room_id] ?
      rooms[room_id].join(player_id) :
      { error: [rooms, `could not join room ${room_id} with player_id ${player_id}`] }

  this.deleteRoom = async ({ room_id }) => {
    if (!rooms[room_id]) return;

    let script_id = await rooms[room_id].getScriptId()

    await rooms[room_id].delete();

    await process(async () => {
      let _rooms = await _redis.get("rooms");

      _rooms[script_id] = array_remove_element(_rooms[script_id], room_id)
      await _redis.set("rooms", _rooms);
    })
  }

  this.restartRoom = ({ room_id }) => rooms[room_id].restart();

  this.updateScriptOfRoom = ({ room_id, script_id }) => rooms[room_id].updateScript(script_id);

  this.getAllRoomIds = async () => {
    let room_categories = await _redis.get("rooms");
    if (Object.values(room_categories).length === 0) return [];
    return Object.values(room_categories).reduce((a, b) => a.concat(b), [])
  }

  this.getRooms = async ({ script_id }) => {
    let { [script_id]: room_ids } = await _redis.get("rooms");
    return Object.fromEntries(await Promise.all(
      room_ids.map(async room_id => (
        [
          room_id,
          await rooms[room_id].getMeta()
        ]
      ))
    ))
  }

  this.getAllMetas = async ({ script_id }) => {
    let { [script_id]: room_ids } = await _redis.get("rooms");

    console.log(room_ids);

    if (!room_ids) return {};

    return Object.fromEntries(await Promise.all(
      room_ids.map(async room_id => (
        [
          room_id,
          {
            ...await rooms[room_id].getMeta(),
            instructions_map: await rooms[room_id].getInstructionsMap()
          }
        ]
      ))
    ))
  }

  this.getInstructions = async ({ room_id, player_id }) =>
    rooms[room_id] ?
      { instructions: rooms[room_id].getPlayer(player_id) } :
      { error: `room with room_id ${room_id} does not exist in RoomManager.rooms` }


  this.getRoleUrlsOfRoom = ({ room_id }) => rooms[room_id].getRoleUrls()

  this.updateStatusOfRole = ({ player_id, status }) => process(async () => {
    let room = await this.get();
    if (!room) return;
    let role = Object.entries(room.players).find(([_url]) => _url === player_id)[1];
    role.status = status;
    room.players = { ...room.players, [player_id]: role };
    this.set(room);
  })

  this.getGameCount = ({ room_id }) => rooms[room_id].getGameCount();
}

function Room({ _redis, _mongo, _mqtt }) {

  let queue = {};
  let process = (key, func) => {
    if (!queue[key]) queue[key] = new Q();
    return queue[key].add(func);
  }

  let room_id = null;
  let received_swipes = {};
  let last_interactions = {};
  let script_id = null;

  let subscribed_topics = new Set();

  const subscribe = (topic, callback) => {
    _mqtt.subscribe(topic, callback);
    subscribed_topics.add(topic);
  }

  this.getMeta = () => _redis.get(room_id)
  this.getInstructionsMap = () => _redis.get(`${room_id}_instructions_map`)

  this.getGameCount = async () => {
    let meta = await this.getMeta();
    return meta?.game_count;
  }

  this.getPlayer = (player_id) => _redis.get(`${room_id}${player_id}`)
  this.getPlayerRestart = (player_id) => _redis.get(`${room_id}${player_id}_restart`)
  this.getScriptId = async () => {
    if (!script_id) {
      let meta = await this.getMeta();
      script_id = meta.script_id;
    }
    return script_id
  }

  this.setMeta = (meta) => _redis.set(room_id, meta)

  const setInstructionsMap = (instructions_map) => _redis.set(`${room_id}_instructions_map`, instructions_map)

  this.setPlayer = ({ player_id, player }) => _redis.set(`${room_id}${player_id}`, [player])
  this.setPlayerRestart = ({ player_id, player }) => _redis.set(`${room_id}${player_id}_restart`, [player])
  this.setRoomId = id => room_id = id

  this.setRoomName = room_name => process('meta', async () => {
    let meta = await this.getMeta();
    meta.room_name = room_name;
    await this.setMeta(meta);
    return true;
  })


  const updateMeta = (func) => process('meta', async () => {
    let meta = await this.getMeta();
    meta = await func(meta);
    await this.setMeta(meta);
  })

  this.create = async ({ script, script_id }) => {
    try {
      room_id = crypto.randomBytes(3).toString('hex');

      let players_instructions = {};
      let players_meta = {};

      let instructions_map = {}

      Object.entries(script.roles).forEach(([role_id, role]) => {
        players_instructions[role_id] = role.instructions;

        players_meta[role_id] = {
          status: 'uninitialized',
          instruction_index: 0,
          instructions_length: role.instructions.length,
          instruction: role.instructions[0],
          autoswipe: false,
          role_id,
          name: role.name
        }
        role.instructions.forEach(({ instruction_id }) =>
          instructions_map[instruction_id] = role.name
        )
      })

      Object.keys(players_meta).forEach(player_id => received_swipes[player_id] = []);

      let meta = {
        design_id: script.design_id ? script.design_id : 'europalia3_mikey',
        players: players_meta,
        room_name: room_id,
        game_count: 0,
        script_id
      }
      await this.setMeta(meta);

      await setInstructionsMap(instructions_map)


      Object.entries(players_instructions).forEach(([player_id, player]) => {
        this.setPlayer({ player_id, player });
        this.setPlayerRestart({ player_id, player });
      })

      this.monitor();

      return { room_id, role_ids: Object.keys(script.roles) };
    } catch (error) {
      console.error(error);
      return { error };
    }
  }

  this.delete = async () => {
    let meta = await this.getMeta();
    Object.keys(meta.players).forEach(player_id => {
      _redis.del(`${room_id}${player_id}`);
      _redis.del(`${room_id}${player_id}_restart`);
    })

    _redis.del(room_id);

    subscribed_topics.forEach(subscribed_topic =>
      _mqtt.unsubscribe(subscribed_topic)
    )
  }
  /* 
    this.get = async () => {
      try {
        let room = await _redis.get(`r_${room_id}`);
        if (!room)
          throw ['getRoom', 'no room available with this url'];
        return room;
      } catch (error) {
        console.error(error);
        return false
      }
    } */

  // this.set = (room) => _redis.set(`r_${room_id}`, room)

  this.restart = async () => {
    // maybe eventually we should make this bit 'smarter':
    // empty the queue, and temporarily prevent adjustments
    // until we get confirmation from all the connected players
    // that they have restarted the game (to prevent out-of-sync)

    console.log('restart room!');
    let meta = await this.getMeta();
    meta.players = Object.fromEntries(Object.entries(meta.players).map(
      ([player_id, player]) => ([
        player_id,
        { ...player, instruction_index: 0 }
      ])
    ))
    meta.count = meta.count + 1;
    await this.setMeta(meta);

    Object.keys(meta.players).forEach(async (player_id) => {
      let player = await this.getPlayerRestart(player_id);
      this.setPlayer({ player_id, player });
      _mqtt.send(`/${room_id}/${meta.players[player_id].role_id}/restart`, true);
      received_swipes[player_id] = [];
    })
  }



  this.updateScript = (script_id) => process(async () => {
    /* try {
      console.log('_rooms.updateScriptOfRoom');
      let script = await _mongo.getCollection('scripts').findDocument({ script_id });
  
      let room = await _redis.get(`r_${room_id}`);
      if (!room)
        throw ['updateScriptOfRoom', 'no room available with this url', room_id];
  
      Object.entries(script.roles).forEach(async ([role_id, role]) => {
        let instructions = role.instruction_ids.map(instruction_id => {
          let instruction = Object.filter(
            script.instructions[instruction_id], key =>
            ['text', 'type', 'instruction_id', 'next_role_ids',
              'prev_instruction_ids', 'timespan', 'sound'].indexOf(key) != -1
  
          )
          return { ...instruction, instruction_id };
        });
        let player_id = Object.entries(room.players).find(
          ([player_id, role]) => role.role_id === role_id
        )[0];
        room.players[player_id] = { instructions, role_id, status: 'uninitialized' };
      })
  
      room._players = { ...room.players };
      let result = await this.set(room);
      return { success: true, result: result };
    } catch (e) {
      return { success: false, errors: e };
    } */

  })

  this.join = (player_id) => process(
    'meta',
    async () => {
      try {
        let meta = await this.getMeta();
        let { role_id, instruction_index, autoswipe, status } = meta.players[player_id];

        let instructions = await this.getPlayer(player_id);
        let _instructions = await this.getPlayerRestart(player_id);

        if (status !== 'connected') {
          meta.players[player_id].status = 'connected';
          _mqtt.send(`/monitor/${room_id}/${player_id}/status`, { status: 'connected' })
        }

        meta.players[player_id].last_interaction = new Date().getTime();
        await this.setMeta(meta);

        return {
          role_id,
          instructions,
          _instructions,
          instruction_index,
          player_id,
          room_id,
          autoswipe,
          design_id: meta.design_id
        }
      } catch (error) {
        console.error(error);
        return { error }
      }
    })

  this.getRoleUrls = async () => {
    let meta = await this.getMeta();
    return { player_ids: Object.keys(meta.players) };
  }

  this.updateInstructionIndexOfPlayer = ({ player_id, instruction_index }) => updateMeta(meta => {
    meta.players[player_id].instruction_index = instruction_index;
    return meta;
  })

  this.updateCurrentInstructionOfPlayer = ({ player_id, instruction_index }) => updateMeta(async meta => {
    // update current_card for the monitor
    const instructions = await this.getPlayer(player_id);
    const instruction = instructions[instruction_index];
    meta.players[player_id].instruction = instruction;
    _mqtt.send(`/monitor/${room_id}/${meta.players[player_id].role_id}/current_instruction`, instruction);
    return meta;
  })

  const removeFromPrevInstructionIdsOfPlayer = ({ player_id, instruction_id }) => process(
    player_id,
    async () => {
      try {
        let player = await this.getPlayer(player_id);
        console.log('removeFromPrevInstructionIdsOfPlayer', player[0].prev_instruction_ids);
        let instruction_index = player.findIndex(instruction => {

          return instruction.prev_instruction_ids.indexOf(instruction_id) !== -1
        });
        if (!instruction_index && instruction_index !== 0)
          throw `could not find instruction ${instruction_id} in player ${player_id}`

        let instruction = player[instruction_index];
        instruction.prev_instruction_ids = instruction.prev_instruction_ids.filter(v => v != instruction_id);
        await this.setPlayer({ player_id, player });
        return { instruction, instruction_index }
      } catch (error) {
        console.error(error);
        return { error };
      }
    })

  // this.removeInstructionOfRole = async ({ role_id, instruction_id }) => process(async () => {
  //   try {
  //     /*  let room = await _redis.get(`r_${room_id}`);
  //      let [player_id, player] = Object.entries(room.players).find(([player_id, player]) => player.role_id === role_id);
  //      if (!player) throw `player is undefined`;
  //      player = player.filter(v => v.instruction_id !== instruction_id);
  //      await this.set({ ...room, players: { ...room.players, [player_id]: player } });
  //      return player; */
  //   } catch (error) {
  //     console.error(`removeInstructionOfRole`, { room_id, role_id, instruction_id }, error);
  //     return false;
  //   }
  // })

  const updateLastInteractionPlayer = (player_id) => updateMeta(meta => {
    meta.players[player_id].last_interaction = new Date().getTime();
    return meta
  })

  /*   const updateLastInteractionPlayer = (player_id) => process('meta', async () => {
      let meta = await this.getMeta();
      meta.players[player_id].last_interaction = performance.now();
      await this.setMeta(meta);
    }) */

  const checkLastInteractions = () => process('meta', async () => {
    let meta = await this.getMeta();
    if (!meta) return;
    const now = new Date().getTime();
    let meta_has_changed = false;
    Object.entries(meta.players).forEach(([player_id, player]) => {
      if (player.status === 'connected' && now - player.last_interaction > 5000) {
        player.status = 'disconnected';
        _mqtt.send(`/monitor/${room_id}/${player_id}/status`, { status: 'disconnected' })
        meta_has_changed = true;
      } else if (player.status !== 'connected' && now - player.last_interaction < 5000) {
        player.status = 'connected';
        _mqtt.send(`/monitor/${room_id}/${player_id}/status`, { status: 'connected' })
        meta_has_changed = true;
      }
    })

    if (meta_has_changed)
      await this.setMeta(meta)

    setTimeout(checkLastInteractions, 2000)
  })

  /*   const checkLastInteractions = () => process('meta', async () => {
      let meta = await this.getMeta();
      const now = new Date().getTime();
      let meta_has_changed = false;
  
      for (let player in meta.players) {
        if (player.status === 'connected' && now - player.last_interaction > 5000) {
          player.status = 'disconnected';
          meta_has_changed = true;
        }
        if (player.status !== 'connected' && now - player.last_interaction < 5000) {
  
        }
      }
      if (meta_has_changed)
        await this.setMeta(meta)
  
      setTimeout(checkLastInteractions, 2000)
    }) */


  // const pingPlayer = async (player_id) => {
  //   try {
  //     let meta = await this.getMeta();
  //     let { role_id } = meta.players[player_id];

  //     let pings = {};
  //     let lost_packages = 0;
  //     let ping_id = 0;

  //     _mqtt.subscribe(`/${room_id}/${role_id}/pong`, async (message, topic) => {
  //       last_interactions[player_id] = performance.now();
  //       const { ping_id, time } = JSON.parse(message);
  //       if ((ping_id == 0 && pings[999]) || (ping_id !== 0 && pings[ping_id - 1])) {
  //         lost_packages++;
  //         console.error('lost package', `/${room_id}/${role_id}/pong`, 'total lost_packages', lost_packages);
  //         _mqtt.send(`/monitor/${room_id}/${player_id}/lost_packages`, { lost_packages });
  //       }
  //       const now = new Date().getTime();
  //       let delta = (now - pings[ping_id]) / 2;
  //       let delta2 = ((now - time) + (time - pings[ping_id])) / 2;
  //       _mqtt.send(`/monitor/${room_id}/${role_id}/ping`, { ping: parseInt(delta) });
  //       delete pings[ping_id]
  //     })


  //     const ping = async () => {
  //       let meta = await this.getMeta();
  //       let { role_id, status } = meta.players[player_id];
  //       const now = new Date().getTime();
  //       if( now - last_interactions[player_id] > 5000){
  //         console.error('have not had an interaction')
  //       }
  //       if (status !== 'connected') return;
  //       pings[ping_id] = new Date().getTime();
  //       _mqtt.send(`/${room_id}/${role_id}/ping`, { ping_id });
  //       ping_id = (ping_id + 1) % 1000;
  //       setTimeout(ping, 2000);
  //     }

  //     ping();
  //   } catch (error) {
  //     console.error('pingPlayer: ', error);
  //   }
  // }

  const monitorPlayer = ({ player_id, player }) => {
    console.log('monitor player', player_id, player);

    // pingPlayer({ player_id, room_id })

    subscribe(`/${room_id}/${player.role_id}/ping`, async (message, topic) => {
      const { timestamp } = JSON.parse(message);
      const now = new Date().getTime();
      _mqtt.send(`/monitor/${room_id}/${player.role_id}/ping`, { ping: parseInt((now - timestamp)) });
      _mqtt.send(`/${room_id}/${player.role_id}/pong`, { timestamp });

      updateLastInteractionPlayer(player_id);
    })

    subscribe(`/${room_id}/${player.role_id}/instruction_index`, async (message) => {
      let { instruction_index } = JSON.parse(message);
      this.updateInstructionIndexOfPlayer({ player_id, instruction_index })
      this.updateCurrentInstructionOfPlayer({ player_id, instruction_index })
    })

    subscribe(`/${room_id}/${player.role_id}/swipe`, async (message) => {
      let { instruction_id, role_id } = JSON.parse(message);

      console.log('+ SWIPE: ', instruction_id, ', for player:', player_id, ', from role:', role_id)

      if (!received_swipes[player_id]) received_swipes[player_id] = []

      if (received_swipes[player_id].indexOf(instruction_id) !== -1) return

      received_swipes[player_id].push(instruction_id);
      console.log('+++ UNIQUE SWIPE: ', instruction_id, ', for player:', player_id, ', from role:', role_id)

      let { instruction, instruction_index, error } = await removeFromPrevInstructionIdsOfPlayer({ player_id, instruction_id });
      if (error) {
        console.error('removeFromPrevInstructionIdsOfPlayer failed during swipe for player ', player.role_id);
      }
      process('meta', async () => {
        let meta = await this.getMeta();
        let player_meta = meta.players[player_id];
        if (player_meta.instruction_index === instruction_index) {
          _mqtt.send(`/monitor/${room_id}/${player.role_id}/current_instruction`, instruction);
          player_meta.instruction = instruction;
          await this.setMeta(meta);
        }
      })
    })

    subscribe(`/${room_id}/${player.role_id}/restart/confirmation`, () => {
      console.info('received confirmation from ', player.role_id, 'of room', room_id);
    });

    subscribe(`/${room_id}/${player.role_id}/autoswipe`, (message) => {
      let { autoswipe } = JSON.parse(message);

      updateMeta(meta => {
        let player_meta = meta.players[player_id];
        if (autoswipe === player_meta.autoswipe) return
        player_meta.autoswipe = autoswipe;
        return meta;
      })
    });
  }

  this.monitor = async () => {
    try {
      console.log('monitor room ', room_id);
      let { players, script_id, room_name } = await this.getMeta();
      let instructions_map = await this.getInstructionsMap();

      Object.entries(players).forEach(([player_id, player]) =>
        monitorPlayer({ player_id, player })
      )
      _mqtt.send(`/createRoom/${script_id}`, JSON.stringify({ room_id, players, script_id, instructions_map, room_name }));

      checkLastInteractions();
    } catch (err) {
      console.error(err);
    }
  }
}






module.exports = RoomManager;