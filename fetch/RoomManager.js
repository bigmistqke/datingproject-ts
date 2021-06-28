function RoomManager({ _redis, _mongo }) {
    this.role = new RoleManager({ _redis, _mongo })
    this.create = async ({ script_id, script }) => {
        // get from mongodb
        if (!script)
            script = await _mongo.getCollection('scripts').findDocument({ script_id });

        if (!script) return { error: 'did not find any script' };

        let room_url = crypto.randomBytes(3).toString('hex');
        let room = {
            script_id,
            roles: {}
        };
        Object.entries(script.roles).forEach(([role_id, instruction_ids]) => {
            let role_url = crypto.randomBytes(1).toString('hex');
            let instructions = instruction_ids.map(instruction_id => {
                let instruction = Object.filter(
                    script.instructions[instruction_id], key =>
                    ['text', 'type', 'instruction_id', 'next_role_ids',
                        'prev_instruction_ids', 'timespan'].indexOf(key) != -1
                )
                return { ...instruction, instruction_id };
            });
            room.roles[role_url] = {
                instructions,
                status: null,
                index: 0,
                role_id: role_id
            }
        })

        _redis.set('r_' + room_url, room);
        _redis.set('createRoom', room_url)
        return { room_url, room };
    }

    this.join = async ({ room_url, role_url }) => {
        let { role, error } = await this.role.getRole({ room_url, role_url });
        if (error) return { error };
        role.status = 'connected';
        return { role_id: role.role_id, instructions: role.instructions };
    }

    this.delete = async ({ room_url }) => {
        //console.log('delete room ', room_url);
        _redis.del(`r_${room_url}`);
    }

    this.getRooms = async ({ script_id }) => {
        let keys = await _redis.getAllKeys();
        let room_urls = keys.filter(key => key.startsWith('r_'))
        let rooms = {};
        await (() => {
            return Promise.all(
                room_urls.map(
                    async (room_url) => {
                        let room = await _redis.get(room_url);

                        // room = _redis.unflatten(room);
                        // //console.log(JSON.parse(room), 'qejfqejf');
                        if (script_id && room.script_id !== script_id) return false;
                        rooms[room_url.substring(2)] = room;
                    }
                )
            )
        })();
        return rooms
    }
}

function RoleManager({ _redis, _mongo }) {
    this.getRole = async ({ room_url, role_url }) => {
        try {
            let room = await _redis.get(`r_${room_url}`);
            // room = _redis.unflatten(room);
            if (!room)
                throw 'no room available with this url';
            let role = room.roles[role_url];
            return { role };
        } catch (e) {
            return { error: e }
        }
    }

    this.getRoleUrls = async ({ room_url }) => {
        let room = await _redis.get(`r_${room_url}`);
        // room = _redis.unflatten(room);
        let role_urls = Object.keys(room.roles);
        return { role_urls };
    }

    this.updateIndex = async ({ room_url, role_url, index }) => {
        let room = await _redis.get(`r_${room_url}`);
        // room = _redis.unflatten(room);
        let role = Object.entries(room.roles).find(([_url]) => _url === role_url)[1];
        role.index = index + 1;
        room.roles = { ...room.roles, [role_url]: role };
        //console.log('updateIndex', room);
        _redis.set('r_' + room_url, room);
    }

    this.updateStatus = async ({ room_url, role_url, status }) => {
        let room = await _redis.get(`r_${room_url}`);
        let role = Object.entries(room.roles).find(([_url]) => _url === role_url)[1];
        role.status = status;
        room.roles = { ...room.roles, [role_url]: role };
        _redis.set('r_' + room_url, room);
    }

    this.removeFromPrevInstructionIds = async ({ room_url, role_url, instruction_id }) => {
        let room = await _redis.get(`r_${room_url}`);
        let role = room.roles[role_url];
        let instruction = role.instructions.find(v => v.prev_instruction_ids.indexOf(instruction_id) !== -1);
        if (!instruction) {
            // console.error('could not find card', instruction_id);
            return;
        }
        instruction.prev_instruction_ids = instruction.prev_instruction_ids.filter(v => v != instruction_id);
        //console.log('remove ', instruction_id, ' from ', instruction, 'from room ', JSON.stringify(room));

        return await _redis.set('r_' + room_url, room);
    }

    this.removeInstruction = async ({ room_url, role_url, instruction_id }) => {
        let room = await _redis.get(`r_${room_url}`);
        let prev_instructions = [...room.roles[role_url].instructions];
        room.roles[role_url].instructions = room.roles[role_url].instructions.filter(v => v.instruction_id !== instruction_id);
        // //console.log(room, room.roles[role_url].instructions, prev_instructions, role_url, instruction_id);
        return await _redis.set('r_' + room_url, room);
    }
}