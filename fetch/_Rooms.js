var crypto = require('crypto');
var _Q = require('./_Q.js');

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key))
        .reduce((res, key) => (res[key] = obj[key], res), {});

function _Rooms({ _redis, _mongo, _mqtt }) {
    // this.role = new RoleManager({ _redis, _mongo });
    let _qs = {};

    let _process = (room_url, vars, func) => {
        if (!_qs[room_url])
            _qs[room_url] = new _Q();
        return _qs[room_url].add({ func, vars })
    }

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

    this.createRoom = async ({ script_id, script }) => {
        // let _room = new _Room({ _redis, _mongo });
        // let { room, room_url } = await _room.create({ script_id, script });
        script = script ? script : await _mongo.getCollection('scripts').findDocument({ script_id });
        script_id = script_id ? script_id : script.script_id;

        if (!script) return { error: 'did not find any script' };


        let room_url = crypto.randomBytes(3).toString('hex');

        let room = {
            script_id,
            roles: {}
        };
        console.info('script', JSON.stringify(script));

        console.info('script.roles', script.roles);

        Object.entries(script.roles).forEach(async ([role_id, role]) => {
            let instruction_ids = role.instruction_ids;
            let role_url = crypto.randomBytes(1).toString('hex');

            console.info('get instruction');

            let instructions = instruction_ids.map(instruction_id => {
                let instruction = Object.filter(
                    script.instructions[instruction_id], key =>
                    ['text', 'type', 'instruction_id', 'next_role_ids',
                        'prev_instruction_ids', 'timespan', 'sound'].indexOf(key) != -1

                )
                console.info(role_id, instruction);

                return { ...instruction, instruction_id };
            });
            room.roles[role_url] = { instructions, role_id, name: role.name, status: 'uninitialized' };
        })

        room._roles = { ...room.roles };


        let result = await _redis.set('r_' + room_url, room);
        console.info('room created ', result);
        return { room, room_url };
    }

    this.restartRoom = async ({ room_url }) => {
        try {
            let room = await _redis.get(`r_${room_url}`);
            if (!room)
                throw 'no room available with this url';

            console.log(room);
            room.roles = { ...room._roles };
            let result = await _redis.set('r_' + room_url, room);

            Object.entries(room.roles).forEach(([role_url, role]) => {
                _mqtt.send(`/${room_url}/${role.role_id}/restart`, role);
                _mqtt.subscribe(`/${room_url}/${role.role_id}/restart/confirmation`, () => {
                    console.info('received confirmation from ', role.role_id, 'of room', room_url);
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

    this.getRoom = async ({ room_url }) => {
        try {
            let room = await _redis.get(`r_${room_url}`);
            if (!room)
                throw 'no room available with this url';
            return room;
        } catch (e) {
            return { error: e }
        }
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

    this.joinRoom = async ({ room_url, role_url }) => _process(room_url, { room_url, role_url },
        async ({ room_url, role_url }) => {
            // //console.log('joined the room yo! ', role_url);

            let { role, error } = await this.getRoleOfRoom({ room_url, role_url });
            if (error) return { error };
            // //console.log('joined the room yo!');
            role.status = 'connected';
            this.updateStatusOfRole({ room_url, role_url, status: 'connected' });
            // //console.log('joined the room')
            return { role_id: role.role_id, instructions: role.instructions };
        })



    this.deleteRoom = async ({ room_url }) => _process(room_url, { room_url },
        async ({ room_url }) => {
            _redis.del(`r_${room_url}`);
        })


    this.getRoleUrlsOfRoom = async ({ room_url }) => {

        let room = await _redis.get(`r_${room_url}`);
        if (!room) return { error: 'received null' };

        let role_urls = Object.keys(room.roles);

        return { role_urls };
    }

    this.getRolesOfRoom = async ({ room_url }) => {
        try {
            let room = await _redis.get(`r_${room_url}`);
            if (!room)
                throw 'no room available with this url';
            return { roles: room.roles };
        } catch (e) {
            return { error: e }
        }
    }

    this.getRoleOfRoom = async ({ room_url, role_url }) => {
        try {
            let room = await _redis.get(`r_${room_url}`);
            if (!room)
                throw 'no room available with this url';
            let role = room.roles[role_url];
            return { role, room };
        } catch (e) {
            return { error: e }
        }
    }

    this.updateScriptOfRoom = ({ room_url, script_id }) => _process(room_url, { room_url, script_id },
        async ({ room_url, script_id }) => {
            try {
                let script = await _mongo.getCollection('scripts').findDocument({ script_id });

                let room = await _redis.get(`r_${room_url}`);
                if (!room)
                    throw 'no room available with this url';

                Object.entries(script.roles).forEach(async ([role_id, instruction_ids]) => {
                    let instructions = instruction_ids.map(instruction_id => {
                        let instruction = Object.filter(
                            script.instructions[instruction_id], key =>
                            ['text', 'type', 'instruction_id', 'next_role_ids',
                                'prev_instruction_ids', 'timespan', 'sound'].indexOf(key) != -1

                        )
                        console.log(instruction);
                        return { ...instruction, instruction_id };
                    });
                    console.log(room.roles);
                    let [role_url, role] = Object.entries(room.roles).find(([role_url, role]) => role.role_id === role_id);
                    room.roles[role_url] = { instructions, role_id, status: 'uninitialized' };
                })

                room._roles = { ...room.roles };
                let result = await _redis.set('r_' + room_url, room);
                return { success: true, result: result };
            } catch (e) {
                return { success: false, errors: e };
            }

        })

    this.updateStatusOfRole = ({ room_url, role_url, status }) => _process(room_url, { room_url, role_url, status },
        async ({ room_url, role_url, status }) => {
            let room = await _redis.get(`r_${room_url}`);
            if (!room) return;
            let role = Object.entries(room.roles).find(([_url]) => _url === role_url)[1];
            role.status = status;
            room.roles = { ...room.roles, [role_url]: role };
            _redis.set('r_' + room_url, room);
        })

    this.removeFromPrevInstructionIdsOfRole = ({ room_url, role_url, instruction_id }) => _process(room_url, { room_url, role_url, instruction_id },
        async ({ room_url, role_url, instruction_id }) => {
            let room = await _redis.get(`r_${room_url}`);
            let role = room.roles[role_url];
            let instruction = role.instructions.find(v => v.prev_instruction_ids.indexOf(instruction_id) !== -1);
            if (!instruction) {
                console.error('could not find card', instruction_id);
                return false;
            }
            instruction.prev_instruction_ids = instruction.prev_instruction_ids.filter(v => v != instruction_id);
            await _redis.set('r_' + room_url, room);
            return role.instructions;
        })

    this.removeInstructionOfRole = async ({ room_url, role_url, instruction_id }) => _process(room_url, { room_url, role_url, instruction_id },
        async ({ room_url, role_url, instruction_id }) => {
            //console.log(' removeInstructionOfRole', room_url, role_url, instruction_id);
            let room = await _redis.get(`r_${room_url}`);
            room.roles[role_url].instructions = room.roles[role_url].instructions.filter(v => v.instruction_id !== instruction_id);
            await _redis.set('r_' + room_url, room);

            return room.roles[role_url].instructions;
        })
}

module.exports = _Rooms;