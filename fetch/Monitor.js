


const { performance } = require('perf_hooks');
function Monitor({ _rooms, _mqtt }) {
  let sendCurrentCardOfRole = async ({ room_id, player_id, instructions }) => {

    if (instructions.length == 0) {
      _rooms.updateStatusOfRole({ room_id, player_id, status: 'finished' });
      _mqtt.send(`/monitor/${room_id}/${player_id}/card`, JSON.stringify({ type: 'end', text: 'the end' }));
      _mqtt.send(`/monitor/${room_id}/${player_id}/status`, JSON.stringify({ status: 'finished' }));

      return;
    }
    if (instructions[0].prev_instruction_ids.length != 0)
      _mqtt.send(`/monitor/${room_id}/${player_id}/card`, JSON.stringify({ type: 'wait', text: '' }));
    else
      _mqtt.send(`/monitor/${room_id}/${player_id}/card`, JSON.stringify({ type: instructions[0].type, text: instructions[0].text }));
  }

  this.pingRole = async ({ player_id, room_id }) => {
    let { role } = await _rooms.getRoleOfRoom({ room_id, player_id });

    let waitingForPing = true;

    _mqtt.subscribe(`/${room_id}/${role.role_id}/pong`, async (message, topic) => {
      let { ping } = JSON.parse(message);
      let delta = performance.now() - ping;
      waitingForPing = false;
      _mqtt.send(`/monitor/${room_id}/${player_id}/ping`, { ping: delta.toFixed(2) });
    })

    const ping = async () => {
      let { role } = await _rooms.getRoleOfRoom({ room_id, player_id });

      let room = await _rooms.getRoom({ room_id });
      if (room.error || !role || role.status !== 'connected') return;

      _mqtt.send(`/${room_id}/${role.role_id}/ping`, { ping: performance.now() });
      setTimeout(() => {

        if (waitingForPing) {
          _mqtt.send(`/monitor/${room_id}/${player_id}/ping`, { ping: 'error' })
        }

        waitingForPing = true;
        ping();
      }, 10000)
    }
    ping();
  }

  const monitorRole = ({ room_id, player_id, role }) => {

    _mqtt.subscribe(`/${room_id}/${role.role_id}/swipe`, async (message, topic) => {
      let { instruction_id, player_id } = JSON.parse(message);

      console.log('MONITOR ROLE : ', JSON.parse(message));

      let instructions = await _rooms.removeInstructionOfRole({
        room_id,
        player_id,
        instruction_id
      });
      if (instructions)
        sendCurrentCardOfRole({
          room_id,
          player_id: player_id,
          instructions
        })
      instructions = await _rooms.removeFromPrevInstructionIdsOfRole(
        {
          room_id: room_id,
          player_id: player_id,
          instruction_id
        }
      );
      if (instructions)
        sendCurrentCardOfRole({
          room_id: room_id,
          player_id: player_id,
          instruction_id
        })
    })
  }

  this.start = async ({ room_id }) => {
    // //console.log
    let { roles, script_id } = await _rooms.getRoom({ room_id });
    if (!roles) return;
    Object.entries(roles).map(([player_id, role]) => monitorRole({ room_id, player_id, role }));
    console.log('createROOOOOOOOM');
    _mqtt.send(`/createRoom/${script_id}`, JSON.stringify({ room_id, roles, script_id }));
  }
}

module.exports = Monitor;