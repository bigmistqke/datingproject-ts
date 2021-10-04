import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useHistory } from "react-router-dom";
import Card from "../components/Card";
import getData from '../helpers/getData';
import memoize from "fast-memoize";

import isMobile from "is-mobile";

function Game({ socket, user_id }) {
    const history = useHistory();
    let { game_url, unsafe } = useParams();

    let [designs, setDesigns] = useState({});

    let r_instructions = useRef();
    let r_room_url = useRef('');
    let r_role_url = useRef('');
    let r_role_id = useRef('');

    let r_overlay = useRef();
    let r_isMobile = useRef(-1);

    let [fullscreen, setFullscreen] = useState(false);

    let r_videos = useRef({});

    let [progress, setProgress] = useState(0);
    let [render, setRender] = useState(performance.now());

    let r_ownSwipes = useRef([]);
    let r_receivedSwipes = useRef([]);
    let r_unconfirmedUpdates = useRef([]);

    let r_isInitialized = useRef(false);
    let r_restartTimer = useRef();

    let r_audioContext = useRef();
    let r_alarm = useRef();

    const preloadVideos = async (instructions) => {
        let promises = [];
        let progresses = {};

        const updateProgress = () => {
            let total_progress = Object.values(progresses).reduce((a, b) => a + b, 0) / Object.values(progresses).length;
            setProgress(parseInt(total_progress));
        }
        for (let instruction of instructions) {
            if (instruction.type === 'video') {
                // eslint-disable-next-line no-loop-func
                promises.push(new Promise((resolve, reject) => {
                    var xhrReq = new XMLHttpRequest();
                    xhrReq.open('GET', `${window._url.fetch}${instruction.text}`, true);
                    xhrReq.responseType = 'blob';
                    xhrReq.onload = function () {
                        if (this.status === 200) {
                            try {
                                let video = document.createElement('video');
                                video.src = URL.createObjectURL(this.response);
                                video.className = 'video';
                                video.setAttribute('playsinline', '');
                                r_videos.current[instruction.instruction_id] = video;
                            } catch (e) {
                                console.error(e);
                            }
                        } else {
                            console.error('video could not load!!!!!');
                        }
                        resolve();

                    }
                    xhrReq.onerror = function () {
                        console.error('err', arguments);
                        window.alert(arguments);
                        resolve();
                    }
                    xhrReq.onprogress = function (e) {
                        if (e.lengthComputable) {
                            const percentComplete = ((e.loaded / e.total) * 100 | 0) + '%';
                            progresses[instruction.instruction_id] = parseInt(percentComplete);
                            updateProgress();
                        }
                    }
                    xhrReq.send();
                }))
            }
        }
        return Promise.all(promises);
    }

    const initAlarm = useCallback(() => {
        r_alarm.current = document.createElement('audio');

        var xhrReq = new XMLHttpRequest();
        xhrReq.open('GET', `${process.env.PUBLIC_URL}/audio/ping.wav`, true);
        xhrReq.responseType = 'blob';
        xhrReq.onload = function () {
            if (this.status === 200) {
                console.log('dled alarm');
                r_audioContext.current = window.AudioContext || window.webkitAudioContext;
                r_alarm.current.src = URL.createObjectURL(this.response);
                r_alarm.current.play();
                r_alarm.current.volume = 0.0000001;
            }
        }
        xhrReq.send();

    }, [])

    const playAlarm = useCallback(() => {
        return new Promise((resolve) => {
            console.log(r_alarm.current);
            r_alarm.current.currentTime = 0;
            r_alarm.current.volume = 0.5;

            r_alarm.current.onended = () => {
                resolve();
            }
            r_alarm.current.play();
        })

    }, [])

    const getDesigns = async () => {
        let result = await fetch(`${window._url.fetch}/api/card/get/test`);
        result = await result.json();
        if (!result || result.designs) return;
        setDesigns(result.designs);
        setRender(performance.now());
    }

    const joinRoom = async () => {

        let result = await fetch(`${window._url.fetch}/api/room/join/${game_url}`);
        if (!result) {
            console.error('could not fetch instructions: double check the url');
            return false;
        }
        result = await result.json();
        console.log(result);
        return result;
    }

    /*     const initCookie = () => {
            setCookie('ownCards', '');
            setCookie('receivedCards', '');
        } */

    /*     const addToCookie = (id, type) => {
            try {
                let data = getCookie(type);
                if (data != '') data += ','
                data += id;
                setCookie(type, data);
            } catch (e) {
     
            }
        } */

    /*     const setCookie = (cname, cvalue, exdays) => {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = `${cname}=${cvalue};${expires};path=/${game_url}`;
        } */

    /*     const getCookie = (cname) => {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        } */

    const init = async () => {
        // initAlarm();
        window.isUnsafe = unsafe ? true : false;
        r_isMobile.current = isMobile();
        if (r_isMobile.current) document.getElementsByTagName('html')[0].classList.add('isMobile');
        if (!socket) return

        // get data via express
        const { instructions, role_id, room_url, role_url } = await joinRoom();

        const card_designs = await getDesigns();

        r_room_url.current = room_url;
        r_role_url.current = role_url;
        r_role_id.current = role_id;

        await preloadVideos(instructions);

        r_instructions.current = instructions;
        /* if (document.cookie != '') {
     
            try {
                getCookie('receivedCards').split(',').forEach(instruction_id => {
                    removeFromPrevInstructionIds(instruction_id, false)
                });
                getCookie('ownCards').split(',').forEach(instruction_id => {
                    removeInstruction(instruction_id, false);
                });
            } catch (e) {
                console.error(e);
            }
        } else {
            // initCookie();
        } */

        console.log('socket is ', socket);
        socket.subscribe(`/${room_url}/${role_id}/ping`, (message, topic) => {
            console.info('ping!');
            socket.send(`/${room_url}/${role_id}/pong`, message);
        })

        socket.subscribe(`/${room_url}/${role_id}/restart`, (message, topic) => {
            console.info('restart!');
            restart();
            socket.send(`/monitor/${room_url}/${role_id}/restart/confirmation`, JSON.stringify({ success: true }));
        })

        socket.subscribe(`/${room_url}/${role_id}/forcedSwipe`, (message, topic) => {
            let instruction = r_instructions.current[0];
            if (instruction.prev_instruction_ids.length !== 0) return;
            swipeAction(instruction);
            socket.send(`/monitor/${room_url}/${role_id}/forcedSwipe/confirmation`, JSON.stringify({ success: true }));
        })

        socket.subscribe(`/${room_url}/${role_id}/swipe`, receiveSwipedCard);
        socket.subscribe(`/${room_url}/${role_id}/confirmation`, receiveConfirmation);
        socket.send(`/${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'connected' }));
        window.addEventListener('beforeunload', () => {
            socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
        })
        /*         window.addEventListener('beforeunload', () => {
                    socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
                }) */
        window.onbeforeunload = async function () {
            let result = await fetch(`${window._url.fetch}/api/room/disconnect/${room_url}/${role_url}`);
            socket.send(`${room_url}/${role_id}/status`, JSON.stringify({ role_url, status: 'disconnected' }));
        }
        setRender(performance.now());
    }

    useEffect(() => {
        if (!r_isInitialized.current) init();

    }, [socket])

    const removeInstruction = (instruction_id, shouldRender = true) => {
        let _instructions = [...r_instructions.current];
        _instructions = _instructions.filter(v => v.instruction_id !== instruction_id);
        r_instructions.current = _instructions;
        if (!shouldRender) return;
        setRender(performance.now());
    }

    const sendFinished = () => {
        socket.send(`/${r_room_url.current}/${r_role_id.current}/status`, JSON.stringify({ status: 'finished', role_url: r_role_url.current }));
    }

    const sendSwipedCardToNextRoleIds = (instruction_id, next_role_ids) => {
        const resend = ({ role_id, instruction_id }) => {
            if (r_unconfirmedUpdates.current.indexOf(`${role_id}_${instruction_id}`) === -1) return;
            socket.send(`/${r_room_url.current}/${role_id}/swipe`, JSON.stringify({ role_id: r_role_id.current, role_url: r_role_url.current, instruction_id }));
            setTimeout(() => { resend({ role_id, instruction_id }) }, 500);
        }

        console.log('ok')

        next_role_ids.forEach(next_role_id => {
            console.log(next_role_id);

            if (next_role_id === r_role_id.current) {
                receiveSwipedCard(JSON.stringify({ role_id: r_role_id.current, instruction_id }));
            }
            socket.send(`/${r_room_url.current}/${next_role_id}/swipe`, JSON.stringify({ role_id: r_role_id.current, role_url: r_role_url.current, instruction_id }));
            console.log('this happenned !', instruction_id);
            r_unconfirmedUpdates.current.push(`${next_role_id}_${instruction_id}`);
            setTimeout(() => { resend({ role_id: next_role_id, instruction_id }) }, 500);
        })
    }

    const receiveConfirmation = (json) => {
        try {
            let { instruction_id, role_id } = JSON.parse(json);
            let resend_id = `${role_id}_${instruction_id}`;
            r_unconfirmedUpdates.current.splice(r_unconfirmedUpdates.current.indexOf(resend_id), 1);
        } catch (e) {
            console.error(e);
        }
    }

    const removeFromPrevInstructionIds = (instruction_id, shouldRender = true) => {
        let _instructions = [...r_instructions.current];
        let _instruction = false;
        for (let v of _instructions) {
            if (v.prev_instruction_ids.indexOf(instruction_id) !== -1) {
                _instruction = v;
                break;
            }
        }

        if (!_instruction) console.error('could not find card', instruction_id);

        if (!!_instruction) {
            if (typeof prev_instruction_ids === 'object') {
                _instruction.prev_instruction_ids.splice(
                    _instruction.prev_instruction_ids.indexOf(instruction_id), 1);
            }
            _instruction.prev_instruction_ids.splice(
                _instruction.prev_instruction_ids.indexOf(instruction_id), 1);
        }

        r_instructions.current = _instructions;
        if (!shouldRender) return;
        setRender(performance.now());
    }

    const receiveSwipedCard = (json) => {
        try {
            let { instruction_id, role_id } = JSON.parse(json);
            socket.send(`/${r_room_url.current}/${role_id}/confirmation`, JSON.stringify({ instruction_id, role_url: r_role_url.current, role_id: r_role_id.current }));
            if (r_receivedSwipes.current.indexOf(instruction_id) == -1) {
                r_receivedSwipes.current.push(instruction_id);
                removeFromPrevInstructionIds(instruction_id);
                // addToCookie(instruction_id, `receivedCards`);
            }
        } catch (e) {
            console.error(e)
        }
    }

    const waitYourTurn = useCallback((reason) => {
        if (!reason) {
            r_overlay.current.classList.add('hidden')
            return;
        }
        try {
            window.navigator.vibrate(200);
        } catch (e) {
            console.error(e);
        }
        r_overlay.current.children[0].innerHTML = reason;
        r_overlay.current.classList.remove('hidden');
    }, [r_overlay]);

    const hideOverlay = useCallback(() => {
        r_overlay.current.classList.add('hidden');
    }, [])

    const enterGame = () => {
        setFullscreen(true);
        initAlarm();
        if (r_isMobile.current) {
            try {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(e => console.error(e));

                } else if (elem.webkitRequestFullscreen) { /* Safari */
                    elem.webkitRequestFullscreen().catch(e => console.error(e));
                } else if (elem.msRequestFullscreen) { /* IE11 */
                    elem.msRequestFullscreen().catch(e => console.error(e));
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    const restart = async () => {
        r_instructions.current = [];
        setRender(performance.now());

        const { instructions } = await joinRoom();
        r_receivedSwipes.current = [];
        r_instructions.current = instructions;
        // initCookie();
        setRender(performance.now());
    }

    const refetch = async () => {
        const { instructions } = await joinRoom();
        r_instructions.current = instructions;
        // initCookie();
        setRender(performance.now());
    }

    const addToOwnSwipes = useCallback((instruction_id) => {
        r_ownSwipes.current.push(instruction_id);
        // addToCookie(instruction_id, `ownCards`)
    }, [])

    const Intro = () => {
        return <button className='centered uiText' onClick={enterGame}><span>Click Here To Start Your Date</span></button>
    }

    const swipeAction = (instruction) => {
        sendSwipedCardToNextRoleIds(instruction.instruction_id, instruction.next_role_ids);
        if (r_instructions.current.length === 1) {
            sendFinished();
        }
        setTimeout(() => {
            removeInstruction(instruction.instruction_id);
        }, 125);
        addToOwnSwipes(instruction.instruction_id);
        if (r_instructions.current.length > 1 && r_instructions.current[1].type === 'video') {
            let id = `${r_instructions.current[1].instruction_id}_video`;
            document.querySelector(`#${id}`).play();
            document.querySelector(`#${id}`).pause();
        }
    }

    const Game = () => {
        return (
            <div className='fullWidth'>

                <div ref={r_overlay} onClick={hideOverlay} className='overlay hidden'><span>Wait Your Turn</span></div>
                {
                    r_instructions.current ?
                        <div className="Cards">
                            {
                                [...r_instructions.current].map(
                                    (instruction, i) => {
                                        if (i > 5) return null
                                        let zIndex = r_instructions.current.length - i;
                                        let margin = Math.max(0, i);
                                        return (
                                            <div key={instruction.instruction_id}
                                                className='card-offset'
                                                style={{ marginLeft: margin * 20, marginTop: margin * 20 }}>
                                                <Card
                                                    alarm={instruction.sound ? playAlarm : false}
                                                    offset={i}
                                                    zIndex={zIndex}
                                                    instruction_id={instruction.instruction_id}
                                                    dataurl={instruction.type === 'video' ? r_videos.current[instruction.instruction_id] : ''}
                                                    text={instruction.text}
                                                    type={instruction.type}
                                                    timespan={instruction.timespan ? instruction.timespan : 0}
                                                    flip={instruction.prev_instruction_ids.length == 0}
                                                    waitYourTurn={waitYourTurn}
                                                    swipeAction={() => { swipeAction(instruction) }}
                                                    video={r_videos.current[instruction.instruction_id]}
                                                    designs={designs}
                                                ></Card>
                                            </div>

                                        )
                                    }
                                )
                            }
                            {
                                r_instructions.current.length < 2 ?
                                    <span className='centered uiText'>Het<br></br>Einde</span> :
                                    null
                            }
                        </div> :
                        <span className='centered fullWidth uiText'>{progress}%</span>
                }
            </div>
        )
    }

    return r_isMobile.current === -1 ?
        null :
        fullscreen ?
            Game() :
            Intro()
}

export default Game