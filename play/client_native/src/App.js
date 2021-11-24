import React, { useEffect, useState, useRef, useCallback } from 'react';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';
import Prompt from './components/Prompt';

import MQTTManager from './helpers/MQTTManager';
import { array_remove_element } from "./helpers/Pure.js"
import MMKVStorage from "react-native-mmkv-storage";

import urls from "./urls"

import { useStore } from "./Store"

const MMKV = new MMKVStorage.Loader().initialize();

function App() {
  let [previous_game_id, setPreviousGameId] = useState(undefined);

  const [socket, setSocket] = useState();
  const [state,
    {
      removeFromPrevInstructionIds,
      removeInstruction,
      setInstructions,
      setDesign,
      setIds
    }
  ] = useStore();




  function isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

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
        xhr.open('GET', `${urls.fetch}${video.text}`, true);
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
    console.log("JOIN ROOM ", game_id);
    let result;
    try {
      result = await fetch(`${urls.fetch}/api/room/join/${game_id}`);
      if (!result) {
        return { success: false, error: 'could not fetch instructions: double check the url' };
      }
      result = await result.json();
      return result;
    } catch (err) {
      return { success: false, error: "ERROR while joining room:", err };
    }
  }

  const sendFinished = () => socket.send(
    `/${state.ids.room}/${state.ids.player}/status`,
    JSON.stringify({ status: 'finished', game_id: state.ids.game })
  )

  const resend = ({ next_role_id, instruction_id }) => {
    if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1) return

    socket.send(
      `/${state.ids.room}/${next_role_id}/swipe`,
      JSON.stringify({ role_id: next_role_id, instruction_id })
    );

    setTimeout(() => resend({ next_role_id, instruction_id }), 500);
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
    }
  }

  const sendSwipedCardToNextRoleIds = useCallback((instruction_id, next_role_ids) => {
    next_role_ids.forEach(next_role_id => {
      if (next_role_id === state.ids.player) {
        receiveSwipedCard(JSON.stringify({ role_id: state.ids.player, instruction_id }));
      }
      socket.send(`/${state.ids.room}/${next_role_id}/swipe`,
        JSON.stringify({ player_id: state.ids.player, instruction_id }));
      unconfirmed_messages.push(`${next_role_id}_${instruction_id}`);
      setTimeout(() => { resend({ next_role_id, instruction_id }) }, 500);
    })
  }, [socket, state.ids.player, state.ids.room])

  const receiveConfirmation = useCallback((json) => {
    try {
      const { instruction_id, role_id: received_role_id } = JSON.parse(json);
      let message_id = `${received_role_id}_${instruction_id}`;
      unconfirmed_messages = array_remove_element(unconfirmed_messages, message_id)
    } catch (e) {
      console.error('receiveConfirmation fails', e);
    }
  }, [socket])

  const receiveSwipedCard = useCallback((json) => {
    try {
      let { instruction_id, role_id: received_role_id } = JSON.parse(json);
      socket.send(`/${state.ids.room}/${received_role_id}/confirmation`,
        JSON.stringify({
          instruction_id,
          role_id: state.ids.player
        })
      )
      if (state.received_instruction_ids.indexOf(instruction_id) == -1) {
        state.received_instruction_ids.push(instruction_id);
        removeFromPrevInstructionIds(instruction_id);
      }
    } catch (e) {
      console.error('receiveSwipedCard fails', e);
    }
  }, [socket, state.received_instruction_ids])

  const initSocket = async () => {
    await socket.connect({ url: urls.socket, port: 443 });
    // set up ping-pong for measuring wifi-strength
    // TODO: revisit pingpong
    socket.subscribe(`/${state.ids.room}/${state.role_id}/ping`, (message, topic) => {
      // socket.send(`/${state.ids.room}/${state.role_id}/pong`, message);
    })
    // subscribe to restart-event from server
    // to restart game from the monitor (emergency)
    socket.subscribe(`/${state.ids.room}/${state.role_id}/restart`, async (message, topic) => {
      let result = await joinRoom(state.ids.room);
      if (!result.success) {
        console.error("could not join room ", result);
        return;
      }
      const { instructions } = result;
      state.received_instruction_ids = [];
      instructions_ref.current = instructions;
      setInstructions(instructions);
      socket.send(
        `/monitor/${state.ids.room}/${state.role_id}/restart/confirmation`,
        JSON.stringify({ success: true })
      );
    })

    // subscribe to a forcedSwipe-event
    // to swipe a card from the monitor (emergency)
    socket.subscribe(`/${state.ids.room}/${state.role_id}/forcedSwipe`, (message, topic) => {
      let instruction = instructions[0];
      if (instruction.prev_instruction_ids.length !== 0) return;
      swipeAction(instruction);
      socket.send(
        `/monitor/${state.ids.room}/${state.role_id}/forcedSwipe/confirmation`,
        JSON.stringify({ success: true })
      );
    })


    // regular subscriptions
    // receiving swiped card from co-player
    console.log("subscribe: ", `/${state.ids.room}/${state.role_id}/swipe`);
    socket.subscribe(
      `/${state.ids.room}/${state.role_id}/swipe`,
      receiveSwipedCard
    );
    // subscribe to confirmation_messages
    socket.subscribe(
      `/${state.ids.room}/${state.role_id}/confirmation`,
      receiveConfirmation
    );


    // publish connected status
    socket.send(
      `/${state.ids.room}/${state.role_id}/status`,
      JSON.stringify({ status: 'connected' })
    );
    // TODO: FIND REPLACEMENT FOR window.onbeforeunload
    /* window.addEventListener('beforeunload', () => {
      // when disconnect: publish disconnected-status
      socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
    }) */
  }


  const fetchDesign = async (card_id) => {
    try {
      console.log("FETCH THAT DECK");
      let result = await fetch(`${urls.fetch}/api/card/get/${card_id}`);
      let design = await result.json();
      console.log("fetchDesign", design);
      return design;

    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const initGame = async (game_id) => {
    console.log("INIT", game_id);
    // state.ids.game = game_id;

    await MMKV.setStringAsync("game_id", game_id);


    // setLoadingMessage("initializing connection");


    let design = await fetchDesign("oldie_2");

    if (!design) {
      console.error("fetch design did not succeed : ");
    };

    setDesign(design);




    let result = await joinRoom(game_id);

    if (!result || !result.success) {
      console.error("joinRoom did not succeed : ", result.error);
      return;
    };

    const { instructions, role_id, room_id, role_url } = result;

    setIds({
      player: role_url,
      role: role_id,
      room: room_id,
    });

    setInstructions(instructions);
    // setSocket(new MQTTManager());
  }

  useEffect(() => {
    if (!socket) return;
    initSocket()
  }, [socket]);

  // useEffect(() => { console.log("DESIGN UPDATED ", state.design) }, [state.design])


  useEffect(() => {
    const checkCachedGameId = async () => {
      previous_game_id = await MMKV.getStringAsync("game_id");
      if (previous_game_id) {
        console.log("HAS PREVIOUS GAME_ID :", previous_game_id);
      }
      setPreviousGameId(previous_game_id);
    }
    checkCachedGameId()
  }, []);



  return (
    <>
      {
        !state.instructions ?
          <ScanScreen onRead={initGame}></ScanScreen> :
          <GameScreen game_id={state.ids.game} instructions={state.instructions} swipeAction={swipeAction} />
      }

      {
        previous_game_id && !state.instructions ?
          <Prompt
            text='open previous game?'
            onSubmit={
              (result) => {
                if (!result) {
                  setPreviousGameId(false)
                } else {
                  initGame(previous_game_id);
                }
              }
            }>
          </Prompt> : null
      }
    </>
  );
}

export default App;
