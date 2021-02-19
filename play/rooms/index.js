const Mqtt = require('./Mqtt.js');
const redis = require("redis");
const jsonify = require('redis-jsonify')
const promisify = require('util').promisify;
const flat = require('flat');
var unflatten = require('flat').unflatten;

let _mqtt, _redis;

_redis = redis.createClient();
const _get = promisify(_redis.get).bind(_redis);
const _set = promisify(_redis.set).bind(_redis);


const disconnect = async (json) => {
    try {
        const { room_id, user_id } = JSON.parse(json);
        console.log(room_id, user_id);
        let data = await _get(`room_${room_id}`);

        if (data === null) {
        } else {
            data = JSON.parse(data);
            let updated_cast = Object.entries(data.cast).filter(([role, id]) => {
                console.log(id, role, user_id);
                return id !== user_id;
            });
            if (updated_cast.length == 0) {
                // delete the room
                _redis.del(`room_${room_id}`);
            } else {
                // update room
                data.cast = Object.fromEntries(updated_cast);
                // data = flat(data, { safe: true });
                console.log(data);
                _redis.set(`room_${room_id}`, JSON.stringify(data));
            }
        }

    } catch (e) {
        console.log(e);
    }
}

const createRoom = async (json) => {
    console.log("TRYING TO CONNECT YO");
    try {
        const { script_id, user_id } = JSON.parse(json);

        // get roles -> create link for every role
        let roles = await _get(`s_${script_id}_temp_roles`);

        await _set(`r_${room_id}`, JSON.stringify(data));

    } catch (e) {
        console.log(e);
    }
}

const connect = async (json) => {
    console.log("TRYING TO CONNECT YO");
    /* try {
        const { script_id, room_id, user_id } = JSON.parse(json);
        console.log(script_id, room_id, user_id);
        // add to room
        let role_id = await addToRoom({ script_id, room_id, user_id });

        console.log('role is ', role_id);
        if (!role_id) {
            _mqtt.send(`/usr/${user_id}/connected`, JSON.stringify(
                { success: false, error: 'no more roles available' }
            ));
            return;
        };
        // get cards for role
        let r_instructions = await _get(`${script_id}_roles`);
        r_instructions = unflatten(JSON.parse(r_instructions));
        r_instructions = r_instructions[role_id];

        // get info of those cards
        let allInstructions = await _get(`${script_id}_instructions`);
        allInstructions = unflatten(JSON.parse(allInstructions));

        r_instructions = r_instructions.map(v => {
            // console.log(allInstructions[v]);
            console.log(v);
            let next_instruction_role = allInstructions[allInstructions[v].next_instruction_id];
            next_instruction_role = next_instruction_role ? next_instruction_role.role_id : null;
            return {
                instruction_id: v,
                next_instruction_role: next_instruction_role,
                ...allInstructions[v]
            }
        });
        _mqtt.send(`/usr/${user_id}/connected`, JSON.stringify(
            { success: true, role_id: role_id, instructions: r_instructions }
        ));
    } catch (e) {
        console.log('errrrrr', e);
    } */
}

const init = async () => {
    _mqtt = await new Mqtt("localhost");
    _redis.on("error", function (error) {
        console.error(error);
    });
    _mqtt.subscribe('/connect', connect);
    _mqtt.subscribe('/disconnect', disconnect);
}

init();

console.log('ok');
