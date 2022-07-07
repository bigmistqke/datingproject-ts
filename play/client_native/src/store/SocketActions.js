import MQTTManager from '../helpers/MQTTManager';
import urls from '../urls';

import { array_remove_element } from "../helpers/Pure"
import { error } from "../helpers/log"

const socket = new MQTTManager();


export default function Socket({ state, actions, ref }) {

  let unconfirmed_messages = [];

  const thisPath = () => `${ref.ids.room}/${ref.ids.role}`

  this.disconnectSocket = () => socket.disconnect();
  this.reconnectSocket = () => socket.reconnect();

  this.getNow = () => new Date().getTime() + ref.clock_delta


  this.initSocket = async () => {
    try {
      await socket.connect({ url: urls.socket, port: 443 });
      this.ping();
      return true;
    } catch (err) {
      error("ERROR AT initSocket", err);
      return false;
    }
  }

  this.initSubscriptions = ({ room_id, role_id }) => {
    socket.subscribe(
      `/${room_id}/${role_id}/restart`,
      () => {
        actions.restartGame();
        unconfirmed_messages = [];
        socket.send(
          `/monitor/${room_id}/${role_id}}/restart/confirmation`,
          { success: true }
        );
      })

    socket.subscribe(
      `/${room_id}/${role_id}}/forcedSwipe`,
      () => {
        actions.swipeAway(ref.instruction_index);
        actions.swipe(ref.instructions[ref.instruction_index]);
        socket.send(
          `/monitor/${room_id}/${role_id}}/forcedSwipe/confirmation`,
          { success: true }
        );
      })

    socket.subscribe(
      `/${room_id}/${role_id}}/forcedRefresh`,
      () => {
        actions.initGame(ref.ids.game);
      })


    socket.subscribe(
      `/${room_id}/${role_id}}/swipe`,
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
      `/${room_id}/${role_id}}/confirmation`,
      ({ instruction_id, role_id: received_role_id }) => {
        let message_id = `${received_role_id}_${instruction_id}`;
        unconfirmed_messages = array_remove_element(unconfirmed_messages, message_id);

      }
    );

    socket.subscribe(
      `/${room_id}/${role_id}}/autoswipe`,
      ({ autoswipe }) => {
        state.autoswipe.set(autoswipe);
      }
    );

    socket.send(
      `/${room_id}/${role_id}}/status`,
      {
        status: 'connected'
      }
    );
  }

  this.removeSubscriptions = ({ room_id, role_id }) => {
    socket.unsubscribe(`/${room_id}/${role_id}/restart`);
    socket.unsubscribe(`/${room_id}/${role_id}}/forcedSwipe`);
    socket.unsubscribe(`/${room_id}/${role_id}}/swipe`);
    socket.unsubscribe(`/${room_id}/${role_id}}/confirmation`);
    socket.unsubscribe(`/${room_id}/${role_id}}/autoswipe`);
    socket.unsubscribe(`/${room_id}/${role_id}/restart`);
    socket.unsubscribe(`/${room_id}/${role_id}}/status`);
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
      let swipe_id = `${next_role_id}_${instruction_id}`;
      socket.send(
        `/${ref.ids.room}/${next_role_id}/swipe`,
        {
          role_id: ref.ids.role,
          instruction_id,
          timestamp: this.getNow()
        });

      if (next_role_id == ref.ids.role) return;
      if (unconfirmed_messages.indexOf(swipe_id) === -1)
        unconfirmed_messages.push(swipe_id);

      setTimeout(() => {
        if (unconfirmed_messages.indexOf(swipe_id) === -1) return
        this.sendSwipe({ next_role_id, instruction_id });
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

    let clock_delta = parseInt((timestamp - ((start + now) / 2)));

    return clock_delta;
  }

  this.syncClock = async () => {
    let clock_deltas = [];

    await calculateClockDelta();
    for (let i = 0; i < 20; i++) {
      clock_deltas.push(await calculateClockDelta());
    }

    let clock_delta = clock_deltas.reduce((a, b) => a + b) / clock_deltas.length;

    state.clock_delta.set(clock_delta)
  }


}