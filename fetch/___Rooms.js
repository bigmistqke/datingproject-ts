var crypto = require('crypto');
var _Q = require('./_Q.js');

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key))
        .reduce((res, key) => (res[key] = obj[key], res), {});

function _Rooms({ _redis, _mongo }) {
    // this.role = new RoleManager({ _redis, _mongo });
    let rooms = {};

    this.init = async () => {
        //console.log('init')
        let rooms = await this.getAllRoomUrls({});
        //console.log(rooms);
        /* rooms.forEach((room) => {
            room_url = room_url.replace('r_', '');
            rooms[room_url] = new Room();
            rooms[room_url].init();
        }) */
    }

    this.create = async ({ script_id, script }) => {
        let _room = new _Room({ _redis, _mongo });
        let { room, room_url } = await _room.create({ script_id, script });
        rooms[room_url] = _room;
        return { room_url, room };
    }

    this.delete = async ({ room_url }) => _redis.del(room_url)

    this.join = async ({ room_url, role_url }) => {
        rooms[room_url].join({ role_url });
    }

    this.getAllRoomUrls = async () => {
        let keys = await _redis.getAllKeys();
        return keys.filter(key => key.startsWith('r_'));
    }

    this.getRooms = async ({ script_id }) => {
        let room_urls = await this.getAllRoomUrls();
        let rooms = {};
        await (() => {
            return Promise.all(
                room_urls.map(
                    async (room_url) => {
                        let room = await _redis.get(room_url);
                        if (script_id && room.script_id !== script_id) return false;
                        rooms[room_url.substring(2)] = room;
                    }
                )
            )
        })();
        return rooms
    }

    this.getRoleUrls = async ({ room_url }) => {
        //console.log(rooms, room_url);
        rooms[room_url].getRoleUrls();
    }
}



function _Room({ _mongo, _redis }) {
    this.script_id;
    this.room_url;

    let _q = new _Q();

    this.process = (func) => new Promise((resolve, error) => _q.add(func, resolve));

    this.init = async ({ script }) => this.process(async () => {
        //console.log('this happens');
        Object.entries(script.roles).forEach(async ([role_id, instruction_ids]) => {
            let _role = new _Role({ _room: this, _mongo, _redis });
            let { role, role_url } = _role.create({ role_id, instruction_ids, script });
            room.roles[role_url] = role;
        })
    })

    this.create = async ({ script, script_id }) => this.process(async () => {
        // get from mongodb            
        script = script ? script : await _mongo.getCollection('scripts').findDocument({ script_id });
        this.script_id = script_id ? script_id : script.script_id;

        if (!script) return { error: 'did not find any script' };

        this.room_url = crypto.randomBytes(3).toString('hex');

        let room = {
            script_id,
            roles: {}
        };

        Object.entries(script.roles).forEach(async ([role_id, instruction_ids]) => {
            let _role = new _Role({ _room: this, _mongo, _redis });
            let { role, role_url } = _role.create({ role_id, instruction_ids, script });
            room.roles[role_url] = role;
        })

        await _redis.set('r_' + this.room_url, room);
        await _redis.set('createRoom', this.room_url);
        return { room_url: this.room_url, room };
    })



    this.monitor = () => {

    }

    this.join = async ({ role_url }) => this.process(async () => {
        let { role, error } = await this.role.getRole({ role_url });
        if (error) return { error };
        role.status = 'connected';
        return { role_id: role.role_id, instructions: role.instructions };
    })



    this.delete = async () => this.process(async () => {
        _redis.del(`r_${this.room_url}`);
    })


    this.getRoleUrls = async () => {
        //console.log('yes')
        let room = await _redis.get(`r_${this.room_url}`);
        let role_urls = Object.keys(room.roles);
        //console.log('role_urls are ', role_urls);
        return { role_urls };
    }




}


function _Role({ _room, _redis, _mongo }) {
    let room_url = _room.room_url;
    let role_url;

    /*     let role = {
            instructions: [],
            role_id: null,
            status: 'uninitialized'
        } */

    this.create = ({ role_id, instruction_ids, script }) => {
        role_url = crypto.randomBytes(1).toString('hex');

        instructions = instruction_ids.map(instruction_id => {
            let instruction = Object.filter(
                script.instructions[instruction_id], key =>
                ['text', 'type', 'instruction_id', 'next_role_ids',
                    'prev_instruction_ids', 'timespan'].indexOf(key) != -1
            )
            return { ...instruction, instruction_id };
        });

        return { role: { instructions, role_id }, role_url };
    }

    this.getRole = async () => _room.process(async () => {
        try {
            let room = await _redis.get(`r_${room_url}`);
            if (!room)
                throw 'no room available with this url';
            let role = room.roles[role_url];
            return { role };
        } catch (e) {
            return { error: e }
        }
    })



    this.updateIndex = async ({ room_url, role_url, index }) => _room.process(async () => {
        let room = await _redis.get(`r_${room_url}`);
        let role = Object.entries(room.roles).find(([_url]) => _url === role_url)[1];
        role.index = index + 1;
        room.roles = { ...room.roles, [role_url]: role };
        _redis.set('r_' + room_url, room);
    })

    this.updateStatus = async ({ room_url, role_url, status }) => _room.process(async () => {
        let room = await _redis.get(`r_${room_url}`);
        let role = Object.entries(room.roles).find(([_url]) => _url === role_url)[1];
        role.status = status;
        room.roles = { ...room.roles, [role_url]: role };
        _redis.set('r_' + room_url, room);
    })

    this.removeFromPrevInstructionIds = async ({ room_url, role_url, instruction_id }) => _room.process(async () => {
        let room = await _redis.get(`r_${room_url}`);
        let role = room.roles[role_url];
        let instruction = role.instructions.find(v => v.prev_instruction_ids.indexOf(instruction_id) !== -1);
        if (!instruction) {
            console.error('could not find card', instruction_id);
            return;
        }
        instruction.prev_instruction_ids = instruction.prev_instruction_ids.filter(v => v != instruction_id);
        //console.log('remove ', instruction_id, ' from ', instruction, 'from room ', JSON.stringify(room));

        return await _redis.set('r_' + room_url, room);
    })

    this.removeInstruction = async ({ room_url, role_url, instruction_id }) => _room.process(async () => {
        let room = await _redis.get(`r_${room_url}`);
        room.roles[role_url].instructions = room.roles[role_url].instructions.filter(v => v.instruction_id !== instruction_id);
        return await _redis.set('r_' + room_url, room);
    })
}

module.exports = _Rooms;