import MQTTManager from '../helpers/MQTTManager';
import urls from '../urls';

import { array_remove_element } from "../helpers/Pure"

const socket = new MQTTManager();

export default function Socket({ state, setState, actions, ref }) {

  let unconfirmed_messages = [];

  const thisPath = () => `${state.ids.room}/${state.ids.player}`

  this.initSocket = async () => {
    await socket.connect({ url: urls.socket, port: 443 });

    // set up ping-pong for measuring wifi-strength
    // TODO: revisit pingpong
    socket.subscribe(`/${thisPath()}/ping`, (message, topic) => {
      // socket.send(`/${thisPath()}/pong`, message);
    })

    socket.subscribe(`/${thisPath()}/restart`, async (message, topic) => {
      actions.restart();
      socket.send(`/monitor/${thisPath()}/restart/confirmation`,
        JSON.stringify({ success: true }));
    })

    socket.subscribe(`/${thisPath()}/forcedSwipe`, (message, topic) => {
      actions.swipe(state.instructions[0]);
      socket.send(`/monitor/${thisPath()}/forcedSwipe/confirmation`,
        JSON.stringify({ success: true }));

    })

    socket.subscribe(`/${thisPath()}/swipe`, (json) => {
      try {
        let { instruction_id, role_id } = JSON.parse(json);
        this.sendConfirmation({ role_id, instruction_id });
        actions.removeFromPrevInstructionIds(instruction_id);
      } catch (e) {
        console.error('error: ', e);
      }
    });

    socket.subscribe(`/${thisPath()}/confirmation`, (json) => {
      try {
        const { instruction_id, role_id: received_role_id } = JSON.parse(json);
        let message_id = `${received_role_id}_${instruction_id}`;
        unconfirmed_messages = array_remove_element(unconfirmed_messages, message_id)
      } catch (e) {
        console.error('receiveConfirmation fails', e);
      }
    });

    socket.send(`/${thisPath()}/status`, JSON.stringify({ status: 'connected' }));
    // TODO: FIND REPLACEMENT FOR window.onbeforeunload
    /* window.addEventListener('beforeunload', () => {
      // when disconnect: publish disconnected-status
      socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
    }) */
  }

  this.sendConfirmation = ({ role_id, instruction_id }) => {
    socket.send(`/${state.ids.room}/${role_id}/confirmation`,
      JSON.stringify({
        instruction_id,
        role_id: state.ids.player
      })
    )
  }

  this.resendMessage = ({ next_role_id, instruction_id }) => {
    if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1) return

    socket.send(`/${state.ids.room}/${next_role_id}/swipe`,
      JSON.stringify({ role_id: next_role_id, instruction_id }));

    setTimeout(() => this.resendMessage({ next_role_id, instruction_id }), 500);
  }

  this.sendSwipe = ({ next_role_id, instruction_id }) => {
    socket.send(`/${state.ids.room}/${next_role_id}/swipe`,
      JSON.stringify({ player_id: state.ids.player, instruction_id }));
    /*  unconfirmed_messages.push(`${next_role_id}_${instruction_id}`);
     setTimeout(() => {
       if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1) return;
       this.resendMessage({ next_role_id, instruction_id })
     }, 500); */
  }

  this.sendFinished = () => socket.send(
    `/${thisPath()}/status`,
    JSON.stringify({ status: 'finished', game_id: state.ids.game })
  )
}