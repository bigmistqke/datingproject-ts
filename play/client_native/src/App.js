import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button, View, Text, TextInput } from 'react-native';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';

import MQTTManager from './helpers/MQTTManager';
import { array_remove_element } from "./helpers/Pure.js"

// const fetch_url = "fetch.datingproject.net";
// const fetch_url = "http://10.0.2.2:8080";
const fetch_url = "http://10.100.15.24:8080";
const socket_url = "socket.datingproject.net";







function App() {
  // const [socket, setSocket] = useState();
  let socket = useRef(undefined).current;
  let unconfirmed_messages = useRef([]).current;
  let received_instruction_ids = useRef([]).current;

  let game_id_ref = useRef().current;
  let player_id_ref = useRef().current;
  let room_id_ref = useRef().current;
  let instructions_ref = useRef().current;

  let [initialized, setInitialized] = useState(false);


  // const [role_id, setRoleId] = useState(undefined);

  const [instructions, setInstructions] = useState(undefined);

  const [loading_message, setLoadingMessage] = useState(undefined);


  const initMqtt = async () => {
    console.log("INIT MQTT");
    socket = new MQTTManager();
    console.log(socket_url);
    await socket.connect({ url: socket_url, port: 443 });
    console.log("INIT SOCKET ", socket);
    // await socket.connect({ url: 'socket.datingproject.net', port: 443 });
    return;
  }

  useEffect(() => {
  }, [])

  const preloadVideos = async (instructions) => {
    let promises = [];
    let progresses = {};

    const updateProgress = () => {
      let total_progress = Object.values(progresses).reduce((a, b) => a + b, 0) / Object.values(progresses).length;
      setProgress(parseInt(total_progress));
      setLoadingMessage(`loading videos: ${parseInt(total_progress)}% completed`);
    }

    let videos = instructions.filter(instruction => instruction.type === "video");
    for (let video of videos) {
      promises.push(new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', `${fetch_url}${video.text}`, true);
        xhr.responseType = 'blob';
        xhr.onload = function () {
          if (this.status === 200) {
            try {
              // TODO: load video on local_storage
            } catch (e) {
              console.error(e);
            }
          } else {
            console.error('video could not load!!!!!');
          }
          resolve();
        }
        xhr.onerror = function () {
          console.error('err', arguments);
          resolve();
        }
        xhr.onprogress = function (e) {
          if (e.lengthComputable) {
            const percentComplete = ((e.loaded / e.total) * 100 | 0) + '%';
            progresses[instruction.instruction_id] = parseInt(percentComplete);
            updateProgress();
          }
        }
        xhr.send();
      }))
    }

    return Promise.all(promises);
  }
  const joinRoom = async () => {
    console.info("join_room")
    let result;
    try {
      console.log(`${fetch_url}/api/room/join/${game_id_ref}`);

      result = await fetch(`${fetch_url}/api/room/join/${game_id_ref}`);

      if (!result) {
        console.error('could not fetch instructions: double check the url');
        return false;
      }
      result = await result.json();
    } catch (err) {
      console.error("ERROR while joining room:", err);
      return false;
    }
    console.log("result is ", result);
    return result;
  }

  const initSocket = async () => {
    // set up ping-pong for measuring wifi-strength
    // TOO: tidy up pingpong
    socket.subscribe(`/${room_id_ref}/${player_id_ref}/ping`, (message, topic) => {
      socket.send(`/${room_id_ref}/${player_id_ref}/pong`, message);
    })

    // subscribe to restart-event from server
    // to restart game from the monitor (emergency)
    socket.subscribe(`/${room_id_ref}/${player_id_ref}/restart`, async (message, topic) => {
      let result = await joinRoom();

      if (!result) return;
      const { instructions } = result;
      received_instruction_ids = [];
      setInstructions(instructions);
      socket.send(
        `/monitor/${room_id_ref}/${player_id_ref}/restart/confirmation`,
        JSON.stringify({ success: true })
      );
    })

    // subscribe to a forcedSwipe-event
    // to swipe a card from the monitor (emergency)
    socket.subscribe(`/${room_id_ref}/${player_id_ref}/forcedSwipe`, (message, topic) => {
      let instruction = instructions[0];
      if (instruction.prev_instruction_ids.length !== 0) return;
      swipeAction(instruction);
      socket.send(
        `/monitor/${room_id_ref}/${player_id_ref}/forcedSwipe/confirmation`,
        JSON.stringify({ success: true })
      );
    })


    // regular subscriptions
    // receiving swiped card from co-player
    socket.subscribe(
      `/${room_id_ref}/${player_id_ref}/swipe`,
      receiveSwipedCard
    );
    // subscribe to confirmation_messages
    socket.subscribe(
      `/${room_id_ref}/${player_id_ref}/confirmation`,
      receiveConfirmation
    );


    // publish connected status
    socket.send(
      `/${room_id_ref}/${player_id_ref}/status`,
      JSON.stringify({ status: 'connected' })
    );
    // TODO: FIND REPLACEMENT FOR window.onbeforeunload
    /* window.addEventListener('beforeunload', () => {
      // when disconnect: publish disconnected-status
      socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
    }) */
  }

  const swipeAction = (instruction) => {
    sendSwipedCardToNextRoleIds(instruction.instruction_id, instruction.next_role_ids);
    if (instructions.length === 1) {
      sendFinished();
    }
    setTimeout(() => {
      removeInstruction(instruction.instruction_id);
    }, 125);

    // mechanism to implement videos
    if (instructions.length > 1 && instructions[1].type === 'video') {
      console.error("video stop not implemented yet");
      /*         let id = `${instructions[1].instruction_id}_video`;
              document.querySelector(`#${id}`).play();
              document.querySelector(`#${id}`).pause(); */
    }
  }

  const removeInstruction = useCallback((instruction_id) => {
    instructions_ref = instructions_ref.filter(v => v.instruction_id !== instruction_id);
    setInstructions(instructions_ref);
  }, [instructions_ref])

  const sendFinished = () => socket.send(
    `/${room_id_ref}/${player_id_ref}/status`,
    JSON.stringify({ status: 'finished', game_id: game_id_ref })
  )

  const resend = ({ next_role_id, instruction_id }) => {
    if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1) return

    socket.send(
      `/${room_id_ref}/${next_role_id}/swipe`,
      JSON.stringify({ role_id: next_role_id, instruction_id })
    );

    setTimeout(() => resend({ next_role_id, instruction_id }), 500);
  }

  const sendSwipedCardToNextRoleIds = useCallback((instruction_id, next_role_ids) => {
    next_role_ids.forEach(next_role_id => {
      if (next_role_id === player_id_ref) {
        receiveSwipedCard(JSON.stringify({ role_id: player_id_ref, instruction_id }));
      }
      socket.send(`/${room_id_ref}/${next_role_id}/swipe`,
        JSON.stringify({ role_id: player_id_ref, instruction_id }));

      unconfirmed_messages.push(`${next_role_id}_${instruction_id}`);
      // setTimeout(() => { resend({ next_role_id, instruction_id }) }, 500);
    })
  }, [socket])

  const receiveConfirmation = useCallback((json) => {
    try {
      const { instruction_id, role_id: received_role_id } = JSON.parse(json);
      console.log('receiveConfirmation ', instruction_id, received_role_id);
      /* let message_id = `${received_role_id}_${instruction_id}`;
      unconfirmed_messages = array_remove_element(unconfirmed_messages, message_id) */
    } catch (e) {
      console.error('receiveConfirmation fails', e);
    }
  }, [socket])

  const removeFromPrevInstructionIds = useCallback((instruction_id) => {
    try {
      let instruction = instructions_ref.find(instruction =>
        instruction.prev_instruction_ids ?
          instruction.prev_instruction_ids.indexOf(instruction_id) !== -1 :
          null
      )
      if (!instruction) {
        console.error('could not find card', instruction_id)
        return;
      }

      instruction.prev_instruction_ids = array_remove_element(instruction.prev_instruction_ids, instruction_id);
      setInstructions(instructions_ref);
    } catch (err) {
      console.error('removeFromPrevInstructionIds fails', err);
    }

  }, [instructions_ref])

  const receiveSwipedCard = useCallback((json) => {
    try {
      let { instruction_id, role_id: received_role_id } = JSON.parse(json);
      console.log("SOCKET IS : ", socket);
      console.log("INSTRUCTIONS ARE ", instructions_ref);
      socket.send(`/${room_id_ref}/${received_role_id}/confirmation`,
        JSON.stringify({
          instruction_id,
          role_id: player_id_ref
          // role_url,
        })
      )
      if (received_instruction_ids.indexOf(instruction_id) == -1) {
        received_instruction_ids.push(instruction_id);
        removeFromPrevInstructionIds(instruction_id);
      }
    } catch (e) {
      console.error('receiveSwipedCard fails', e);
    }
  }, [socket, received_instruction_ids])

  function isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  const initGame = async (game_id) => {
    game_id_ref = game_id;

    await initMqtt()
    console.log("SOCKET IS ", socket);
    setLoadingMessage("initializing connection");
    let result = await joinRoom();
    console.log(result)
    if (!result) {
      console.error("joinRoom did not succeed : ", result.error);
      return;
    };
    // result = await result.json();
    console.log('result of joinRoom : ', result);
    const { instructions, role_id, room_url, role_url } = result;

    player_id_ref = role_url;
    player_id_ref = role_id;
    room_id_ref = room_url;
    instructions_ref = instructions;

    setLoadingMessage("join a room");
    await preloadVideos(instructions);
    setInstructions(instructions);
    await initSocket();
    setInitialized(true);
  }


  useEffect(() => {
    initGame("1e4e9303")
  }, []);

  useEffect(() => {
    console.log('updated instructions');
    console.log(instructions);
  }, [instructions])
  return (<>
    {
      !initialized ?
        <ScanScreen onRead={initGame}></ScanScreen> :
        !instructions ?
          <LoadingScreen loading_message={loading_message}></LoadingScreen> :
          <GameScreen game_id={game_id_ref} instructions={instructions} swipeAction={swipeAction} />
    }</>

  );
}

export default App;
