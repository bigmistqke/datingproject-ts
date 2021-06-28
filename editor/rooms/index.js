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
    /* try {
        const { script_id, user_id } = JSON.parse(json);
        ////console.log(room_id, user_id);
        let data = await _get(`room_${room_id}`);

        if (data === null) {
        } else {
            data = JSON.parse(data);
            let updated_cast = Object.entries(data.cast).filter(([role, id]) => {
                ////console.log(id, role, user_id);
                return id !== user_id;
            });
            if (updated_cast.length == 0) {
                // delete the room
                _redis.del(`room_${room_id}`);
            } else {
                // update room
                data.cast = Object.fromEntries(updated_cast);
                // data = flat(data, { safe: true });
                ////console.log(data);
                _redis.set(`room_${room_id}`, JSON.stringify(data));
            }
        }

    } catch (e) {
        ////console.log(e);
    } */
}

const addToRoom = async ({ script_id, room_id, user_id }) => {

    /* let data = await _get(`room_${room_id}`)

    ////console.log(room_id, data);
    if (data === null) {
        // get data of script / roles
        ////console.log('script_id', script_id)
        const roles = ['a', 'b'];
        const role = 'a';
        let data = {
            'script_id': script_id,
            'roles': roles,
            'cast': {}
        }
        data.cast[role] = user_id;
        // data = flat(data, { safe: true });
        ////console.log(data);
        return role;
    } else {
        data = JSON.parse(data);
        let taken_roles = Object.keys(data.cast);
        let leftover_roles = data.roles.filter(v => taken_roles.indexOf(v) == -1);
        if (leftover_roles.length != 0) {
            let new_role = leftover_roles[Math.floor(Math.random() * leftover_roles.length)];
            ////console.log(new_role);
            data.cast[new_role] = user_id;
            _redis.set(`room_${room_id}`, JSON.stringify(data));
            return new_role;
        } else {
            ////console.log('no more roles available');
            return false;
        }

    } */

}


const connect = async (json) => {
    /* try {
        const { script_id, user_id } = JSON.parse(json);
        ////console.log(script_id, user_id);

        _redis.set(`editor_room_${script_id}`, JSON.stringify(data));

        _mqtt.send(`/usr/${user_id}/connected`, JSON.stringify(
            { success: true, role_id: role_id, instructions: r_instructions }
        ));
    } catch (e) {
        ////console.log('errrrrr', e);
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

////console.log('ok');
