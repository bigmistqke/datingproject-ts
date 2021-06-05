const _Mongo = require('./modules/_Mongo.js');
const _Redis = require('./modules/_Redis.js');
var crypto = require('crypto');


Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key))
        .reduce((res, key) => (res[key] = obj[key], res), {});


function DatabaseManager({ mongo_url = 'mongodb://localhost:27017' }) {
    const _mongo = new _Mongo({ url: mongo_url, dbName: 'datingProject' });
    const _redis = new _Redis();

    this.init = async () => {
        await _redis.init();
        await _mongo.init();
    }

    this.createRoom = async ({ script_id, script }) => {
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

        _redis.set('r_' + room_url, _redis.flatten(room));

        return { room_url, room };
    }

    this.joinRoom = async ({ room_url, role_url }) => {
        console.log('joooiiiin rooooom');
        try {
            let room = await _redis.get(`r_${room_url}`);
            room = _redis.unflatten(room);
            if (!room)
                throw 'no room available with this url';
            let role = room.roles[role_url];
            role.status = 'connected';
            return { role_id: role.role_id, instructions: role.instructions };
        } catch (e) {
            return { error: e }
        }
    }

    this.getRoleUrls = async ({ room_url }) => {
        let room = await _redis.get(`r_${room_url}`);
        room = _redis.unflatten(room);
        let role_urls = Object.keys(room.roles);
        return { role_urls };
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
                        room = _redis.unflatten(room);
                        if (room.script_id !== script_id) return false;
                        console.log(room.script_id, script_id);
                        rooms[room_url.substring(2)] = room;
                        console.log(rooms);
                    }
                )
            )
        })();
        console.log(rooms);
        return rooms

    }

    this.saveScript = async ({ script_id, blocks, roles, instructions }) =>
        await _mongo.getCollection('scripts').
            updateDocument({ script_id }, { script_id, blocks, roles, instructions })

    this.getScript = async (script_id) => _mongo.getCollection('scripts')
        .findDocument({ script_id });

    this.testScript = async ({ script_id, script }) => {
        let { room_url, room } = await this.createRoom({ script, script_id });
        let roles = Object.entries(room.roles).map(
            ([role_url, role]) => {
                return { role_url, role_id: role.role_id }
            });
        return { roles, room_url }
    }



    this.saveCard = async ({ card, card_id }) =>
        _mongo.getCollection('cards').updateDocument({ card_id }, { designs: card })

    this.getCard = async ({ card_id }) => {
        // TODO: check cache
        return _mongo.getCollection('cards').findDocument({ card_id })
    }
}


module.exports = DatabaseManager;