import MQTTManager from '../helpers/MQTTManager';
import urls from '../urls';

import { array_remove_element } from "../helpers/Pure"
import { log, error } from "../helpers/log"

const socket = new MQTTManager();


export default function Socket({ state, actions, ref }) {

  let unconfirmed_messages = [];

  const thisPath = () => `${ref.ids.room}/${ref.ids.role}`

  this.disconnectSocket = () => socket.disconnect();
  this.reconnectSocket = () => socket.reconnect();

  this.getNow = () => new Date().getTime() - ref.clock_delta

  this.initSocket = async () => {
    try {
      await socket.connect({ url: urls.socket, port: 443 });

      this.ping();

      // set up ping-pong for measuring wifi-strength
      // socket.subscribe(`/${thisPath()}/pong`, ({timestamp}) => {
      //   try {
      //     let { timestamp } = JSON.parse(message);
      //     console.log((this.getNow() - timestamp) / 2);
      //     // socket.send(`/${thisPath()}/pong`, JSON.stringify({ ...message, time: new Date().getTime() }));
      //   } catch (error) {
      //     console.error(error);
      //   }
      // })

      socket.subscribe(
        `/${thisPath()}/restart`,
        () => {
          console.log("restart", ref.ids.game);
          actions.restartGame();
          socket.send(
            `/monitor/${thisPath()}/restart/confirmation`,
            { success: true }
          );
        })

      socket.subscribe(
        `/${thisPath()}/forcedSwipe`,
        () => {
          actions.swipeAway(ref.instruction_index);
          actions.swipe(ref.instructions[ref.instruction_index]);
          socket.send(
            `/monitor/${thisPath()}/forcedSwipe/confirmation`,
            { success: true }
          );
        })

      socket.subscribe(
        `/${thisPath()}/forcedRefresh`,
        () => {
          actions.initGame(ref.ids.game);
        })


      socket.subscribe(
        `/${thisPath()}/swipe`,
        ({ instruction_id, role_id: sender_role_id, timestamp }) => {
          let delta = this.getNow() - timestamp;

          // SEND CONFIRMATION-MESSAGE BACK TO SENDER THAT WE RECEIVED THIS MESSAGE
          setTimeout(
            () => this.sendConfirmation({ role_id: sender_role_id, instruction_id })
            , 50
          )
          if (sender_role_id === ref.ids.role) return;
          actions.removeFromPrevInstructionIds(instruction_id, delta);
        });

      socket.subscribe(
        `/${thisPath()}/confirmation`,
        ({ instruction_id, role_id: received_role_id }) => {
          let message_id = `${received_role_id}_${instruction_id}`;
          unconfirmed_messages = array_remove_element(unconfirmed_messages, message_id);
        }
      );

      socket.subscribe(
        `/${thisPath()}/autoswipe`,
        ({ autoswipe }) => {
          state.autoswipe.set(autoswipe);
        }
      );

      socket.send(
        `/${thisPath()}/status`,
        {
          status: 'connected'
        }
      );
      // TODO: FIND REPLACEMENT FOR window.onbeforeunload
      /* window.addEventListener('beforeunload', () => {
        // when disconnect: publish disconnected-status
        socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
      }) */
    } catch (err) {
      error("ERROR AT initSocket", err);


      return false;
    }

  }

  this.sendConfirmation = ({ role_id, instruction_id }) => {

    socket.send(
      `/${ref.ids.room}/${role_id}/confirmation`,
      {
        instruction_id,
        role_id: ref.ids.role
      }
    )
  }

  this.sendInstructionIndex = () => {
    socket.send(
      `/${ref.ids.room}/${ref.ids.role}/instruction_index`,
      {
        instruction_index: ref.instruction_index
      }
    );
  }

  this.sendSwipe = ({ next_role_id, instruction_id }) => {
    try {
      socket.send(
        `/${ref.ids.room}/${next_role_id}/swipe`,
        {
          role_id: ref.ids.role,
          instruction_id,
          timestamp: this.getNow()
        });

      if (next_role_id == ref.ids.role) return;

      unconfirmed_messages.push(`${next_role_id}_${instruction_id}`);

      setTimeout(() => {
        if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1)
          return

        socket.send(
          `/${ref.ids.room}/${next_role_id}/swipe`,
          {
            role_id: ref.ids.role,
            instruction_id,
            timestamp: this.getNow()
          });
      }, 500);

    } catch (err) {
      error("ERROR SEND SWIPE ", err);
    }

  }

  this.sendFinished = () =>
    socket.send(`/${thisPath()}/status`,
      {
        status: 'finished',
        game_id: ref.ids.game
      }
    )

  this.ping = () => {
    socket.send(
      `/${ref.ids.room}/${ref.ids.role}/ping`,
      {
        timestamp: this.getNow()
      }
    )
    setTimeout(() => this.ping(), 2000);
  }

  const calculateClockDelta = async () => {
    let start = new Date().getTime();
    let result = await fetch(`${urls.fetch}/api/getServerTime`);
    let now = new Date().getTime();
    if (!result || result.status !== 200) return;
    let { timestamp } = await result.json();
    let clock_delta = parseInt((now - (now - start) / 2) - timestamp);
    console.log(clock_delta);
    return clock_delta;
  }

  this.syncClock = async () => {
    let clock_deltas = [];
    await calculateClockDelta();
    for (let i = 0; i < 20; i++) {
      clock_deltas.push(await calculateClockDelta());
    }

    console.log("clock_deltas", clock_deltas.reduce((a, b) => a + b) / clock_deltas.length)
    state.clock_delta.set(clock_deltas.reduce((a, b) => a + b) / clock_deltas.length)
  }
}