var crypto = require('crypto');
var Q = require('../Q.js');

Object.filter = (obj, predicate) =>
  Object.keys(obj)
    .filter(key => predicate(key))
    .reduce((res, key) => (res[key] = obj[key], res), {});

function RoomManager({ _redis, _mongo, _mqtt }) {
  // this.role = new RoleManager({ _redis, _mongo });
  let _qs = {};

  let _process = (room_id, vars, func) => {
    if (!_qs[room_id])
      _qs[room_id] = new Q();
    return _qs[room_id].add({ func, vars })
  }

  this.init = async () => {
    //console.log('init')
    let rooms = await this.getAllRoomUrls({});
    //console.log(rooms);
    /* rooms.forEach((room) => {
        room_id = room_id.replace('r_', '');
        rooms[room_id] = new Room();
        rooms[room_id].init();
    }) */
  }



  this.createRoom = async ({ script_id, script }) => {
    // let _room = new _Room({ _redis, _mongo });
    // let { room, room_id } = await _room.create({ script_id, script });
    script = script ? script : await _mongo.getCollection('scripts').findDocument({ script_id });
    script_id = script_id ? script_id : script.script_id;

    if (!script) return { error: 'did not find any script' };


    let room_id = crypto.randomBytes(3).toString('hex');

    let room = {
      script_id,
      roles: {}
    };


    Object.entries(script.roles).forEach(async ([role_id, role]) => {
      let instruction_ids = role.instruction_ids;
      let player_id = crypto.randomBytes(1).toString('hex');

      let instructions = instruction_ids.map(instruction_id => {
        let instruction = Object.filter(
          script.instructions[instruction_id], key =>
          ['text', 'type', 'instruction_id', 'next_role_ids',
            'prev_instruction_ids', 'timespan', 'sound'].indexOf(key) != -1

        )
        return { ...instruction, instruction_id };
      });
      room.roles[player_id] = { instructions, role_id, name: role.name, status: 'uninitialized' };
    })

    room._roles = { ...room.roles };


    let result = await _redis.set('r_' + room_id, room);
    console.info('room created ', result);
    return { room, room_id };
  }

  this.updateScriptOfRoom = ({ room_id, script_id }) => _process(room_id, { room_id, script_id },
    async ({ room_id, script_id }) => {
      try {
        console.log('_rooms.updateScriptOfRoom');
        let script = await _mongo.getCollection('scripts').findDocument({ script_id });

        let room = await _redis.get(`r_${room_id}`);
        if (!room)
          throw 'no room available with this url', room_id;

        Object.entries(script.roles).forEach(async ([role_id, role]) => {
          console.log('instruction_ids are ', role);
          let instructions = role.instruction_ids.map(instruction_id => {
            let instruction = Object.filter(
              script.instructions[instruction_id], key =>
              ['text', 'type', 'instruction_id', 'next_role_ids',
                'prev_instruction_ids', 'timespan', 'sound'].indexOf(key) != -1

            )
            return { ...instruction, instruction_id };
          });
          let player_id = Object.entries(room.roles).find(
            ([player_id, role]) => role.role_id === role_id
          )[0];
          room.roles[player_id] = { instructions, role_id, status: 'uninitialized' };
        })
        console.log('_rooms.updateScriptOfRoom successful', room.roles);

        room._roles = { ...room.roles };
        let result = await _redis.set('r_' + room_id, room);
        return { success: true, result: result };
      } catch (e) {
        return { success: false, errors: e };
      }

    })

  this.restartRoom = async ({ room_id }) => {
    try {
      let room = await _redis.get(`r_${room_id}`);
      if (!room)
        throw 'no room available with this url';

      console.log(room);
      room.roles = { ...room._roles };
      let result = await _redis.set('r_' + room_id, room);

      Object.entries(room.roles).forEach(([player_id, role]) => {
        _mqtt.send(`/${room_id}/${role.role_id}/restart`, role);
        _mqtt.subscribe(`/${room_id}/${role.role_id}/restart/confirmation`, () => {
          console.info('received confirmation from ', role.role_id, 'of room', room_id);
        });

      })

      return { result, room };
    } catch (e) {
      return { error: e }
    }
  }

  this.getAllRoomUrls = async () => {
    let keys = await _redis.getAllKeys();
    return keys.filter(key => key.startsWith('r_'));
  }

  this.getRoom = async ({ room_id }) => {
    try {
      let room = await _redis.get(`r_${room_id}`);
      if (!room)
        throw 'no room available with this url';
      return room;
    } catch (e) {
      return { error: e }
    }
  }

  this.getRooms = async ({ script_id }) => {
    let room_ids = await this.getAllRoomUrls();
    let rooms = {};
    await (() => {
      return Promise.all(
        room_ids.map(
          async (room_id) => {
            let room = await _redis.get(room_id);
            if (script_id && room.script_id !== script_id) return false;
            rooms[room_id.substring(2)] = room;
          }
        )
      )
    })();
    return rooms
  }

  this.joinRoom = async ({ room_id, player_id }) => _process(room_id, { room_id, player_id },
    async ({ room_id, player_id }) => {
      console.log('_rooms.joinRoom', player_id);

      let { role, error } = await this.getRoleOfRoom({ room_id, player_id });
      if (error) return { error };
      // //console.log('joined the room yo!');
      role.status = 'connected';
      this.updateStatusOfRole({ room_id, player_id, status: 'connected' });
      // //console.log('joined the room')
      console.log('_rooms.joinRoom success');

      return { role_id: role.role_id, instructions: role.instructions, player_id, room_id };
    })



  this.deleteRoom = async ({ room_id }) => _process(room_id, { room_id },
    async ({ room_id }) => {
      _redis.del(`r_${room_id}`);
    })


  this.getRoleUrlsOfRoom = async ({ room_id }) => {

    let room = await _redis.get(`r_${room_id}`);
    if (!room) return { error: 'received null' };

    let player_ids = Object.keys(room.roles);

    return { player_ids };
  }

  this.getRolesOfRoom = async ({ room_id }) => {
    try {
      let room = await _redis.get(`r_${room_id}`);
      if (!room)
        throw 'no room available with this url';
      return { roles: room.roles };
    } catch (e) {
      return { error: e }
    }
  }

  this.getRoleOfRoom = async ({ room_id, player_id }) => {
    try {
      let room = await _redis.get(`r_${room_id}`);
      if (!room)
        throw 'no room available with this url';
      let role = room.roles[player_id];
      return { role, room };
    } catch (e) {
      return { error: e }
    }
  }



  this.updateStatusOfRole = ({ room_id, player_id, status }) => _process(room_id, { room_id, player_id, status },
    async ({ room_id, player_id, status }) => {
      let room = await _redis.get(`r_${room_id}`);
      if (!room) return;
      let role = Object.entries(room.roles).find(([_url]) => _url === player_id)[1];
      role.status = status;
      room.roles = { ...room.roles, [player_id]: role };
      _redis.set('r_' + room_id, room);
    })

  this.removeFromPrevInstructionIdsOfRole = ({ room_id, player_id, instruction_id }) => _process(room_id, { room_id, player_id, instruction_id },
    async ({ room_id, player_id, instruction_id }) => {
      let room = await _redis.get(`r_${room_id}`);
      let role = room.roles[player_id];
      let instruction = role.instructions.find(v => v.prev_instruction_ids.indexOf(instruction_id) !== -1);
      if (!instruction) {
        console.error('could not find card', instruction_id);
        return false;
      }
      instruction.prev_instruction_ids = instruction.prev_instruction_ids.filter(v => v != instruction_id);
      await _redis.set('r_' + room_id, room);
      return role.instructions;
    })

  this.removeInstructionOfRole = async ({ room_id, player_id, instruction_id }) => _process(room_id, { room_id, player_id, instruction_id },
    async ({ room_id, player_id, instruction_id }) => {
      console.log('_rooms.removeInstructionOfRole', room_id, player_id, instruction_id);

      let room = await _redis.get(`r_${room_id}`);
      console.log('_rooms.removeInstructionOfRole', room.roles[player_id]);

      room.roles[player_id].instructions = room.roles[player_id].instructions.filter(v => v.instruction_id !== instruction_id);
      await _redis.set('r_' + room_id, room);

      return room.roles[player_id].instructions;
    })
}

module.exports = RoomManager;