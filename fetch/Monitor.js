let _Mqtt = require("./modules/_Mqtt.js")


const isDev = true;
const _url = {
    mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
    fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net"
}

function Monitor(_db) {
    this._mqtt = new _Mqtt();


    this.init = async () => {
        let connection = await this._mqtt.connect(_url.mqtt, true);
    }

    this.removeFromPrevInstructionIds = ({ instructions, instruction_id }) => {

        let _instructions = [...instructions];
        let instruction = _instructions.find(v => v.prev_instruction_ids.indexOf(instruction_id) !== -1)

        if (!instruction) console.error('could not find card', instruction_id);
        if (!!instruction) {
            if (typeof prev_instruction_ids === 'object') {
                instruction.prev_instruction_ids.splice(
                    instruction.prev_instruction_ids.indexOf(instruction_id), 1);
            }
            instruction.prev_instruction_ids.splice(
                instruction.prev_instruction_ids.indexOf(instruction_id), 1);
        }

        return _instructions;
    }

    this.monitor = ({ room_url, roles, script_id }) => {
        //console.log('monitor ', room_url, roles, script_id);
        Object.entries(roles).forEach(([role_url, role]) => {

            // if (!role) return;
            this._mqtt.subscribe(`/${room_url}/${role.role_id}/swipe`, async (message, topic) => {
                let { instruction_id, role_url: _role_url } = JSON.parse(message);
                await _db.room.role.removeInstruction({ room_url, role_url: _role_url, instruction_id });
                await _db.room.role.removeFromPrevInstructionIds({ room_url, role_url, instruction_id });
            })

            this._mqtt.subscribe(`/${room_url}/${role.role_id}/confirmation`, (message, topic) => {
                // let { instruction_id, role_url: _role_url } = JSON.parse(message);
                // _db.room.role.removeInstruction({ room_url, role_url, instruction_id });

            })

            this._mqtt.subscribe(`/${room_url}/${role.role_id}/status`, (message, topic) => {
                let { role_url, status } = JSON.parse(message);
                _db.room.role.updateStatus({ room_url, role_url, status });
            })
        })
        /* this._mqtt.subscribe(`/${room_url}/disconnect`, (message, topic) => {
            let { role_url } = JSON.parse(message);
            //console.log(role_url, ' is disconnected');
            _db.updateStatus({ room_url, role_url, status: 'disconnected' });
        })
        this._mqtt.subscribe(`/${room_url}/connect`, (message, topic) => {
            let { role_url } = JSON.parse(message);
            //console.log(role_url, ' is connected');
            _db.updateStatus({ room_url, role_url, status: 'connected' });
        }) */

        //console.log(`/createRoom/${script_id}`);
        this._mqtt.send(`/createRoom/${script_id}`, JSON.stringify({ room_url, roles, script_id }));

    }
}

module.exports = Monitor;