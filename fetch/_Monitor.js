


const { performance } = require('perf_hooks');
function Monitor({ _rooms, _mqtt }) {
    let sendCurrentCardOfRole = async ({ room_url, role_url, instructions }) => {

        if (instructions.length == 0) {
            _rooms.updateStatusOfRole({ room_url, role_url, status: 'finished' });
            _mqtt.send(`/monitor/${room_url}/${role_url}/card`, JSON.stringify({ type: 'end', text: 'the end' }));
            _mqtt.send(`/monitor/${room_url}/${role_url}/status`, JSON.stringify({ status: 'finished' }));

            return;
        }
        if (instructions[0].prev_instruction_ids.length != 0)
            _mqtt.send(`/monitor/${room_url}/${role_url}/card`, JSON.stringify({ type: 'wait', text: '' }));
        else
            _mqtt.send(`/monitor/${room_url}/${role_url}/card`, JSON.stringify({ type: instructions[0].type, text: instructions[0].text }));
    }

    this.pingRole = async ({ role_url, room_url }) => {
        let { role } = await _rooms.getRoleOfRoom({ room_url, role_url });

        let waitingForPing = true;

        _mqtt.subscribe(`/${room_url}/${role.role_id}/pong`, async (message, topic) => {
            let { ping } = JSON.parse(message);
            let delta = performance.now() - ping;
            waitingForPing = false;
            _mqtt.send(`/monitor/${room_url}/${role_url}/ping`, { ping: delta.toFixed(2) });
        })

        const ping = async () => {
            let { role } = await _rooms.getRoleOfRoom({ room_url, role_url });

            let room = await _rooms.getRoom({ room_url });
            if (room.error || !role || role.status !== 'connected') return;

            _mqtt.send(`/${room_url}/${role.role_id}/ping`, { ping: performance.now() });
            setTimeout(() => {

                if (waitingForPing) {
                    _mqtt.send(`/monitor/${room_url}/${role_url}/ping`, { ping: 'error' })
                }

                waitingForPing = true;
                ping();
            }, 10000)
        }
        ping();
    }

    const monitorRole = ({ room_url, role_url, role }) => {


        _mqtt.subscribe(`/${room_url}/${role.role_id}/swipe`, async (message, topic) => {
            let { instruction_id, role_url: _role_url } = JSON.parse(message);
            let instructions = await _rooms.removeInstructionOfRole({ room_url, role_url: _role_url, instruction_id });
            if (instructions) //console.log('removeInstructionOfRole', instructions[0])
                if (instructions)
                    sendCurrentCardOfRole({ room_url, role_url: _role_url, instructions })
            instructions = await _rooms.removeFromPrevInstructionIdsOfRole({ room_url, role_url, instruction_id });
            if (instructions) //console.log('removeFromPrevInstructionIdsOfRole', instructions[0])
                if (instructions)
                    sendCurrentCardOfRole({ room_url, role_url, instructions })
        })
    }

    this.start = async ({ room_url }) => {
        // //console.log
        let { roles, script_id } = await _rooms.getRoom({ room_url });
        if (!roles) return;
        Object.entries(roles).map(([role_url, role]) => monitorRole({ room_url, role_url, role }));
        _mqtt.send(`/createRoom/${script_id}`, JSON.stringify({ room_url, roles, script_id }));
    }
}

module.exports = Monitor;