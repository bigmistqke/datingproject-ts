import MQTTManager from '../helpers/MQTTManager';
import urls from '../urls';

import { array_remove_element } from "../helpers/Pure"
import { log, error } from "../helpers/log"

const socket = new MQTTManager();

export default function Socket({ state, actions, ref }) {

  let unconfirmed_messages = [];

  const thisPath = () => `${ref.ids.room}/${ref.ids.role}`

  this.initSocket = async () => {
    try {
      await socket.connect({ url: urls.socket, port: 443 });

      // set up ping-pong for measuring wifi-strength
      // TODO: revisit pingpong
      socket.subscribe(`/${thisPath()}/ping`, (message, topic) => {
        // socket.send(`/${thisPath()}/pong`, message);
      })

      socket.subscribe(`/${thisPath()}/restart`, async (message, topic) => {
        console.log("RESTART");
        actions.restart();
        socket.send(`/monitor/${thisPath()}/restart/confirmation`,
          JSON.stringify({ success: true }));
      })

      socket.subscribe(`/${thisPath()}/forcedSwipe`, (message, topic) => {
        actions.swipe(ref.instructions[0]);
        socket.send(`/monitor/${thisPath()}/forcedSwipe/confirmation`,
          JSON.stringify({ success: true }));

      })

      console.log("SUBSCRIBE TOOOOO : ", `/${thisPath()}/swipe`);

      socket.subscribe(`/${thisPath()}/swipe`, (json) => {
        try {
          console.log("RECEIVE A SWIPE!!");
          let { instruction_id, role_id } = JSON.parse(json);
          if (role_id === ref.ids.role) return;
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
    } catch (err) {
      console.error("ERROR AT initSocket", err);
      console.log("path");
      console.log(ref);
      return false;
    }

  }

  this.sendConfirmation = ({ role_id, instruction_id }) => {
    socket.send(`/${ref.ids.room}/${role_id}/confirmation`,
      JSON.stringify({
        instruction_id,
        role_id: ref.ids.player
      })
    )
  }

  this.resendMessage = ({ next_role_id, instruction_id }) => {
    if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1) return

    socket.send(`/${ref.ids.room}/${next_role_id}/swipe`,
      JSON.stringify({ role_id: next_role_id, instruction_id }));

    setTimeout(() => this.resendMessage({ next_role_id, instruction_id }), 500);
  }

  this.sendSwipe = ({ next_role_id, instruction_id }) => {
    try {
      socket.send(`/${ref.ids.room}/${next_role_id}/swipe`,
        JSON.stringify({ role_id: ref.ids.role, instruction_id }));
      /*  unconfirmed_messages.push(`${next_role_id}_${instruction_id}`);
       setTimeout(() => {
         if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1) return;
         this.resendMessage({ next_role_id, instruction_id })
       }, 500); */
    } catch (err) {
      console.error("ERROR SEND SWIPE ", err);
    }

  }

  this.sendFinished = () => socket.send(
    `/${thisPath()}/status`,
    JSON.stringify({ status: 'finished', game_id: ref.ids.game })
  )
}