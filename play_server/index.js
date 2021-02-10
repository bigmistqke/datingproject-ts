const Mqtt = require('./Mqtt.js');
const redis = require("redis");
const jsonify = require('redis-jsonify')

let _mqtt, _redis;

const disconnect = (json) => {
    try {
        const { room_id, user_id } = JSON.parse(json);
        _redis.get(`room_${room_id}`, function (err, data) {
            if (err || data === null) {
            } else {
                let updated_cast = Object.entries(data.cast).filter(([role, id]) => id != user_id);
                if (updated_cast.length == 0) {
                    // delete the room
                    _redis.del(`room_${room_id}`);
                } else {
                    // update room
                    data.cast = Object.fromEntries(updated_cast);
                    _redis.set(`room_${room_id}`, data);
                }
            }
        });
    } catch (e) {
        console.log(e);
    }
}

const addToRoom = ({ script_id, room_id, user_id }) => {
    _redis.get(`room_${room_id}`, function (err, data) {
        if (err || data === null) {
            // get data of script / roles
            const roles = ['a', 'b'];
            const role = 'a';
            const data = {
                script_id: script_id,
                roles: roles,
                cast: {}
            }
            data.cast[role] = user_id
            _redis.set(`room_${room_id}`, data)
        } else {
            // find other role
            console.log(data);
            let taken_roles = Object.keys(data.cast);
            console.log("taken_roles", taken_roles);
            let leftover_roles = data.roles.filter(v => taken_roles.indexOf(v) == -1);
            if (leftover_roles.length != 0) {
                let new_role = leftover_roles[Math.floor(Math.random() * leftover_roles.length)];
                console.log(new_role);
                data.cast[new_role] = user_id;
                _redis.set(`room_${room_id}`, data);
            } else {
                console.log('no more roles available');
            }

        }
    });
}

const connect = (json) => {
    try {
        const { script_id, room_id, user_id } = JSON.parse(json);
        console.log(script_id, room_id, user_id);
        // add to room

    } catch (e) {
        console.log(e);
    }

}

const init = async () => {
    const _mqtt = await new Mqtt("localhost");
    _redis = jsonify(redis.createClient());
    _redis.on("error", function (error) {
        console.error(error);
    });
    _mqtt.subscribe('/connect', connect);
    _mqtt.subscribe('/disconnect', disconnect);
}

init();
