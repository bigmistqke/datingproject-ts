const _Redis = require('./modules/_Redis.js');
var crypto = require('crypto');


const RedisManager = function () {
    _Redis.call(this);

    this.getContent = async (script_id) => {
        let blocks = await this._get(`s_${script_id}_temp_blocks`);
        if (!blocks) {
            return false;
        }
        blocks = Object.values(unflatten(blocks));
        let instructions = await this._get(`s_${script_id}_temp_instructions`);
        instructions = this.unflatten(instructions);
        let roles = await this._get(`s_${script_id}_temp_roles`);
        roles = this.unflatten(roles);
        return { roles, blocks, instructions };
    }

    this.createRoom = async () => {
        let roles = await _get(`s_${script_id}_${type}_roles`);
        roles = this.unflatten(roles);
        let room_id = crypto.randomBytes(4).toString('hex');
        let role_data = {};
        // hashmap: urls of the actor/role of the room - role_id, script_id, room_id
        const role_urls = {};
        // keeping track of where in the game the actor is
        const role_status = {};

        Object.keys(roles)
            .forEach(role_id => {
                const url = crypto.randomBytes(4).toString('hex');
                role_urls[url] = { room_id, role_id, script_id };
                role_data[role_id] = url;
                role_status[role_id] = 'start';

            });
        await _hmset('role_urls', role_urls);
        await _hmset(`r_${room_id}`, {
            role_urls: role_data,
            role_status: role_status,
            status: 'start',
            type: type,
            script_id: script_id
        });
    }
}

module.exports = RedisManager