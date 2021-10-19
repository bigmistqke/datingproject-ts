import React, { useEffect, useState, useRef } from 'react';
import { Button, View, Text } from 'react-native';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';

import MQTTManager from './helpers/MQTTManager';
import { array_remove_element } from "./helpers/Pure.js"

const fetch_url = "socket.datingproject.net";

function App() {
  const [socket, setSocket] = useState(undefined);
  const [game_id, setGameId] = useState(undefined);
  const [player_id, setPlayerId] = useState(undefined);
  const [role_id, setRoleId] = useState(undefined);
  const [role_url, setRoleUrl] = useState(undefined);

  const [loading_message, setLoadingMessage] = useState(undefined);
  const [instructions, setInstructions] = useState(undefined);

  const unconfirmed_messages = useRef([]);
  const received_instruction_ids = useRef([]);

  const initMqtt = async () => {
    let _socket = new MQTTManager();
    await _socket.connect({ url: 'socket.datingproject.net' });
    setSocket(_socket);
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
  const joinRoom = async (game_id) => {
    let result = await fetch(`${fetch_url}/api/room/join/${game_id}`);
    if (!result) {
      console.error('could not fetch instructions: double check the url');
      return false;
    }
    result = await result.json();
    console.log(result);
    return result;
  }

  const initSocket = async () => {
    // set up ping-pong for measuring wifi-strength
    // TOO: tidy up pingpong
    socket.subscribe(`/${room_url}/${role_id}/ping`, (message, topic) => {
      socket.send(`/${room_url}/${role_id}/pong`, message);
    })

    // subscribe to restart-event from server
    // to restart game from the monitor (emergency)
    socket.subscribe(`/${room_url}/${role_id}/restart`, async (message, topic) => {
      const { instructions } = await joinRoom();
      received_instruction_ids.current = [];
      setInstructions(instructions);
      socket.send(`/monitor/${room_url}/${role_id}/restart/confirmation`, JSON.stringify({ success: true }));
    })

    // subscribe to a forcedSwipe-event
    // to swipe a card from the monitor (emergency)
    socket.subscribe(`/${room_url}/${role_id}/forcedSwipe`, (message, topic) => {
      let instruction = r_instructions.current[0];
      if (instruction.prev_instruction_ids.length !== 0) return;
      swipeAction(instruction);
      socket.send(`/monitor/${room_url}/${role_id}/forcedSwipe/confirmation`, JSON.stringify({ success: true }));
    })


    // regular subscriptions
    // receiving swiped card from co-player
    socket.subscribe(`/${room_url}/${role_id}/swipe`, receiveSwipedCard);
    // subscribe to confirmation_messages
    socket.subscribe(`/${room_url}/${role_id}/confirmation`, receiveConfirmation);


    // publish connected status
    socket.send(`/${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'connected' }));
    window.addEventListener('beforeunload', () => {
      // when disconnect: publish disconnected-status
      socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
    })
  }

  const swipeAction = (instruction) => {
    sendSwipedCardToNextRoleIds(instruction.instruction_id, instruction.next_role_ids);
    if (r_instructions.current.length === 1) {
      sendFinished();
    }
    setTimeout(() => {
      removeInstruction(instruction.instruction_id);
    }, 125);
    // addToOwnSwipes(instruction.instruction_id);

    console.error("video stop not implemented yet");

    // mechanism to implement videos
    if (instructions.length > 1 && instructions[1].type === 'video') {

      /*         let id = `${r_instructions.current[1].instruction_id}_video`;
              document.querySelector(`#${id}`).play();
              document.querySelector(`#${id}`).pause(); */
    }
  }

  const removeInstruction = (instruction_id) => {
    setInstructions([...instructions].filter(v => v.instruction_id !== instruction_id));
  }

  const sendFinished = () => {
    socket.send(`/${room_url}/${role_id}/status`, JSON.stringify({ status: 'finished', role_url }));
  }

  const sendSwipedCardToNextRoleIds = (instruction_id, next_role_ids) => {
    const resend = ({ next_role_id, instruction_id }) => {
      if (unconfirmed_messages.current.indexOf(`${next_role_id}_${instruction_id}`) === -1) return;
      socket.send(`/${room_url}/${next_role_id}/swipe`,
        JSON.stringify({ role_id: next_role_id, role_url, instruction_id }));
      setTimeout(() => { resend({ next_role_id, instruction_id }) }, 500);
    }

    next_role_ids.forEach(next_role_id => {
      if (next_role_id === role_id) {
        receiveSwipedCard(JSON.stringify({ role_id: role_id, instruction_id }));
      }
      socket.send(`/${room_url}/${next_role_id}/swipe`,
        JSON.stringify({ role_id: role_id, role_url: r_role_url.current, instruction_id }));

      unconfirmed_messages.current.push(`${next_role_id}_${instruction_id}`);
      setTimeout(() => { resend({ next_role_id, instruction_id }) }, 500);
    })
  }

  const receiveConfirmation = (json) => {
    try {
      let { instruction_id, "role_id": received_role_id } = JSON.parse(json);
      let message_id = `${received_role_id}_${instruction_id}`;
      unconfirmed_messages.current = array_remove_element(unconfirmed_messages.current, message_id)
    } catch (e) {
      console.error(e);
    }
  }

  const removeFromPrevInstructionIds = (instruction_id) => {
    let _instructions = [...instructions];
    let _instruction = _instructions.find(instruction =>
      instruction.prev_instruction_ids.indexOf(instruction_id) !== -1
    )
    if (!_instruction) console.error('could not find card', instruction_id);
    _instruction.prev_instruction_ids =
      array_remove_element(_instruction.prev_instruction_ids, instruction_id);
    setInstructions(_instructions);
  }

  const receiveSwipedCard = (json) => {
    try {
      let { instruction_id, role_id: received_role_id } = JSON.parse(json);
      socket.send(`/${room_url}/${received_role_id}/confirmation`,
        JSON.stringify({
          instruction_id,
          role_id: received_role_id,
          role_url,
        })
      )
      if (received_instruction_ids.current.indexOf(instruction_id) == -1) {
        received_instruction_ids.current.push(instruction_id);
        removeFromPrevInstructionIds(instruction_id);
      }
    } catch (e) {
      console.error(e)
    }
  }

  const initGame = async (game_id) => {
    // store.update('game_id', game_id);
    game_id = game_id.replace("https://play.datingproject.net/", "");

    await initMqtt()
    setLoadingMessage("initializing connection");
    const { instructions, role_id, room_url, role_url } = await joinRoom(game_id);
    setRoleId(role_id);
    setRoomUrl(room_url);
    setRoleUrl(role_url);

    setLoadingMessage("join a room");
    await preloadVideos(instructions);
    setInstructions(instructions);
    await initSocket();
  }



  return (<>{
    !game_id ?
      <ScanScreen onRead={initGame}></ScanScreen> :
      !instructions ?
        <LoadingScreen loading_message={loading_message}></LoadingScreen> :
        <GameScreen game_id={game_id} instructions={instructions} />
  }</>

  );
}

export default App;
