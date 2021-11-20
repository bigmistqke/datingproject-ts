import React, { useEffect, useState, useRef, useCallback } from 'react';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';
import Prompt from './components/Prompt';

import MQTTManager from './helpers/MQTTManager';
import { array_remove_element } from "./helpers/Pure.js"
import MMKVStorage from "react-native-mmkv-storage";

import urls from "./urls"
// const urls.fetch = "fetch.datingproject.net";
// const urls.fetch = "https://fetch.datingproject.net/test";
// const urls.fetch = "http://10.100.15.24:8080";
// const urls.fetch = "localhost:8079";
// const urls.fetch = "http://10.100.30.163:8079";
// const urls.socket = "socket.datingproject.net";

const MMKV = new MMKVStorage.Loader().initialize();

function App() {
  const [socket, setSocket] = useState();

  let unconfirmed_messages = useRef([]).current;
  let received_instruction_ids = useRef([]).current;

  let game_id_ref = useRef();
  let player_id_ref = useRef();
  let role_id_ref = useRef();
  let room_id_ref = useRef();
  let instructions_ref = useRef();

  let [previous_game_id, setPreviousGameId] = useState(undefined);

  let [initialized, setInitialized] = useState(false);


  // const [role_id, setRoleId] = useState(undefined);

  const [instructions, setInstructions] = useState(undefined);

  const [loading_message, setLoadingMessage] = useState(undefined);

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
  const joinRoom = async () => {
    console.info("join_room")
    let result;
    try {
      console.log('url : ', `${urls.fetch}/api/room/join/${game_id_ref.current}`);
      result = await fetch(`${urls.fetch}/api/room/join/${game_id_ref.current}`);

      if (!result) {
        return { success: false, error: 'could not fetch instructions: double check the url' };
      }
      console.log(result.status);
      result = await result.json();
    } catch (err) {
      return { success: false, error: "ERROR while joining room:", err };
    }
    console.log("result is ", result);
    return result;
  }

  const initSocket = useCallback(async () => {
    console.log('initSocket', socket);
    console.log(room_id_ref.current, role_id_ref.current);
    await socket.connect({ url: urls.socket, port: 443 });
    // set up ping-pong for measuring wifi-strength
    // TODO: revisit pingpong
    socket.subscribe(`/${room_id_ref.current}/${role_id_ref.current}/ping`, (message, topic) => {
      // socket.send(`/${room_id_ref.current}/${role_id_ref.current}/pong`, message);
    })

    // subscribe to restart-event from server
    // to restart game from the monitor (emergency)
    socket.subscribe(`/${room_id_ref.current}/${role_id_ref.current}/restart`, async (message, topic) => {
      let result = await joinRoom();
      if (!result.success) {
        console.error("could not join room ", result);
        return;
      }
      const { instructions } = result;
      received_instruction_ids = [];
      instructions_ref.current = instructions;
      setInstructions(instructions);
      socket.send(
        `/monitor/${room_id_ref.current}/${role_id_ref.current}/restart/confirmation`,
        JSON.stringify({ success: true })
      );
    })

    // subscribe to a forcedSwipe-event
    // to swipe a card from the monitor (emergency)
    socket.subscribe(`/${room_id_ref.current}/${role_id_ref.current}/forcedSwipe`, (message, topic) => {
      let instruction = instructions[0];
      if (instruction.prev_instruction_ids.length !== 0) return;
      swipeAction(instruction);
      socket.send(
        `/monitor/${room_id_ref.current}/${role_id_ref.current}/forcedSwipe/confirmation`,
        JSON.stringify({ success: true })
      );
    })


    // regular subscriptions
    // receiving swiped card from co-player
    console.log("subscribe: ", `/${room_id_ref.current}/${role_id_ref.current}/swipe`);
    socket.subscribe(
      `/${room_id_ref.current}/${role_id_ref.current}/swipe`,
      receiveSwipedCard
    );
    // subscribe to confirmation_messages
    socket.subscribe(
      `/${room_id_ref.current}/${role_id_ref.current}/confirmation`,
      receiveConfirmation
    );


    // publish connected status
    socket.send(
      `/${room_id_ref.current}/${role_id_ref.current}/status`,
      JSON.stringify({ status: 'connected' })
    );
    // TODO: FIND REPLACEMENT FOR window.onbeforeunload
    /* window.addEventListener('beforeunload', () => {
      // when disconnect: publish disconnected-status
      socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
    }) */
  }, [socket, room_id_ref, role_id_ref]);

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

  const removeInstruction = (instruction_id) => {
    console.log("REMOVE INSTRUCTION? ", instruction_id, instructions);
    instructions_ref.current = [...instructions_ref.current].filter(i => {
      return i.instruction_id !== instruction_id
    })
    setInstructions(instructions_ref.current);
    setTimeout(() => {
      console.log(instructions_ref.current.map(i => i.instruction_id), instructions.map(i => i.instruction_id));
    }, 1000);
  }

  useEffect(() => {
    console.log('instructions changed ', instructions);
  }, [instructions]);

  const sendFinished = () => socket.send(
    `/${room_id_ref.current}/${player_id_ref.current}/status`,
    JSON.stringify({ status: 'finished', game_id: game_id_ref.current })
  )

  const resend = ({ next_role_id, instruction_id }) => {
    if (unconfirmed_messages.indexOf(`${next_role_id}_${instruction_id}`) === -1) return

    socket.send(
      `/${room_id_ref.current}/${next_role_id}/swipe`,
      JSON.stringify({ role_id: next_role_id, instruction_id })
    );

    setTimeout(() => resend({ next_role_id, instruction_id }), 500);
  }

  const sendSwipedCardToNextRoleIds = useCallback((instruction_id, next_role_ids) => {
    next_role_ids.forEach(next_role_id => {
      console.log('sendSwipedCardTo... next_role_id ', next_role_id);
      if (next_role_id === player_id_ref.current) {
        receiveSwipedCard(JSON.stringify({ role_id: player_id_ref.current, instruction_id }));
      }

      console.log('sendSwipedCardToNextRoleIds', player_id_ref.current);


      socket.send(`/${room_id_ref.current}/${next_role_id}/swipe`,
        JSON.stringify({ player_id: player_id_ref.current, instruction_id }));

      unconfirmed_messages.push(`${next_role_id}_${instruction_id}`);
      // setTimeout(() => { resend({ next_role_id, instruction_id }) }, 500);
    })
  }, [socket, player_id_ref, room_id_ref])

  const receiveConfirmation = useCallback((json) => {
    try {
      const { instruction_id, role_id: received_role_id } = JSON.parse(json);
      console.log('receiveConfirmation ', instruction_id, received_role_id);
      let message_id = `${received_role_id}_${instruction_id}`;
      unconfirmed_messages = array_remove_element(unconfirmed_messages, message_id)
    } catch (e) {
      console.error('receiveConfirmation fails', e);
    }
  }, [socket])

  const removeFromPrevInstructionIds = useCallback((instruction_id) => {
    try {
      console.log('removeFromPrevInstructionIds');
      let instruction = instructions_ref.current.find(instruction =>
        instruction.prev_instruction_ids ?
          instruction.prev_instruction_ids.indexOf(instruction_id) !== -1 :
          null
      )

      if (!instruction) {
        console.error('could not find card', instruction_id)
        return;
      }

      instruction.prev_instruction_ids = array_remove_element(instruction.prev_instruction_ids, instruction_id);

      setInstructions([...instructions_ref.current]);
    } catch (err) {
      console.error('removeFromPrevInstructionIds fails', err);
    }

  }, [instructions_ref])

  const receiveSwipedCard = useCallback((json) => {
    try {
      let { instruction_id, role_id: received_role_id } = JSON.parse(json);
      socket.send(`/${room_id_ref.current}/${received_role_id}/confirmation`,
        JSON.stringify({
          instruction_id,
          role_id: player_id_ref.current
        })
      )
      console.log('receiveSwipedCard received_instruction_ids', received_instruction_ids, instruction_id);

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

  const fetchDeck = async (card_id) => {
    try {
      let result = await fetch(`${urls.fetch}/api/card/get/${card_id}`);
      let deck = await result.json();
      console.log("fetchDeck", deck);
      if (!deck) return false;
      setState("deck", deck);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const initGame = async (game_id) => {
    game_id_ref.current = game_id;
    await MMKV.setStringAsync("game_id", game_id);


    setLoadingMessage("initializing connection");


    let deck = await fetchDeck("oldie_2");

    if (!deck) {
      console.error("fetch deck did not succeed : ");
    };

    setDeck(deck);


    let result = await joinRoom();

    if (!result || !result.success) {
      console.error("joinRoom did not succeed : ", result.error);
      return;
    };

    const { instructions, role_id, room_id, role_url } = result;

    console.log(
      'joinRoom result :', instructions, role_id, room_id, role_url
    )

    player_id_ref.current = role_url;
    role_id_ref.current = role_id;
    room_id_ref.current = room_id;
    instructions_ref.current = instructions;

    setInstructions(instructions);

    setLoadingMessage("join a room");

    await preloadVideos(instructions);
    setInstructions(instructions);
    setSocket(new MQTTManager());
    setInitialized(true);
  }

  useEffect(() => {
    if (!socket) return;
    initSocket()
  }, [socket]);


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



  return (<>


    {
      !initialized ?
        <ScanScreen onRead={initGame}></ScanScreen> :
        !instructions ?
          <LoadingScreen loading_message={loading_message}></LoadingScreen> :
          <GameScreen game_id={game_id_ref.current} instructions={instructions} swipeAction={swipeAction} />
    }

    {
      previous_game_id && !initialized ?
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
