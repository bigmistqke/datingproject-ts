import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useHistory } from "react-router-dom";
import Card from "./Card";
import getData from '../helpers/getData';
import memoize from "fast-memoize";

import isMobile from "is-mobile";

var uniqid = require('uniqid');
let not_subscribed = true;

function Game({ socket, user_id }) {
    const history = useHistory();
    let { game_url, unsafe } = useParams();

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

    const preloadVideos = async (instructions) => {
        let promises = [];
        let progresses = {};

        const updateProgress = () => {
            let total_progress = Object.values(progresses).reduce((a, b) => a + b, 0) / Object.values(progresses).length;
            setProgress(parseInt(total_progress));
        }
        let videos_amount = 0;
        let videos_loaded = 0;
        for (let instruction of instructions) {
            if (instruction.type === 'video') {
                videos_amount++;
                let _p = new Promise((resolve) => {
                    /* let video = document.createElement('video');
                    video.src = `${window._url.fetch}${instruction.text}`;
                    r_videos.current[instruction.instruction_id] = video;
                    resolve() */
                    var xhrReq = new XMLHttpRequest();
                    xhrReq.open('GET', `${window._url.fetch}${instruction.text}`, true);
                    xhrReq.responseType = 'blob';
                    xhrReq.onload = function () {
                        videos_loaded++;
                        if (this.status === 200) {
                            try {
                                console.log('loaded ', this.response, URL.createObjectURL(this.response));
                                let video = document.createElement('video');
                                video.src = URL.createObjectURL(this.response);
                                video.className = 'video';
                                video.setAttribute('playsinline', '');

                                r_videos.current[instruction.instruction_id] = video;
                            } catch (e) {
                                console.error(e);
                            }
                            console.log('video preloaded!!! loaded: ', videos_loaded, ' of ', videos_amount);

                        } else {
                            console.error('video could not load!!!!!');
                        }
                        resolve();

                    }
                    xhrReq.onerror = function () {
                        console.log('err', arguments);
                    }
                    xhrReq.onprogress = function (e) {
                        if (e.lengthComputable) {
                            const percentComplete = ((e.loaded / e.total) * 100 | 0) + '%';
                            progresses[instruction.instruction_id] = parseInt(percentComplete);
                            updateProgress();
                        }
                    }
                    xhrReq.send();
                })
                promises.push(_p)
            }
        }
        return Promise.all(promises);
    }

    const initAlarm = () => {
        let alarm = document.createElement('audio');
        alarm.src = `${window._url.fetch}/api/system/ping.mp3`;
        alarm.addEventListener('loadeddata', () => {
            window.alarm = alarm;
        })
        // alarm.play();
    }



    const joinRoom = async () => {
        let result = await fetch(`${window._url.fetch}/api/joinRoom/${game_url}`);
        if (!result) {
            console.error('could not fetch instructions: double check the url');
            return false;
        }
        result = await result.json();
        console.log(result);
        return result;
    }

    const initCookie = () => {
        setCookie('ownCards', '');
        setCookie('receivedCards', '');
    }

    const addToCookie = (id, type) => {
        try {
            let data = getCookie(type);
            if (data != '') data += ','
            data += id;
            setCookie(type, data);
        } catch (e) {

        }
    }

    const setCookie = (cname, cvalue, exdays) => {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = `${cname}=${cvalue};${expires};path=/${game_url}`;
    }

    const getCookie = (cname) => {
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
    }

    const init = async () => {
        // initAlarm();


        window.isUnsafe = unsafe ? true : false;
        r_isMobile.current = isMobile();
        if (r_isMobile.current) document.getElementsByTagName('html')[0].classList.add('isMobile');
        if (!socket) return

        // get data via express
        const { instructions, role_id, room_url, role_url } = await joinRoom();

        console.log(room_url, role_url);

        r_room_url.current = room_url;
        r_role_url.current = role_url;
        r_role_id.current = role_id;

        console.log('joinRoom', { instructions, role_id });

        await preloadVideos(instructions);

        console.log('all videos are preloaded ', instructions);

        r_instructions.current = instructions;
        console.log('cookie is ', document.cookie);
        if (document.cookie != '') {

            console.log(getCookie('receivedCards'), getCookie('ownCards'))
            try {
                getCookie('receivedCards').split(',').forEach(instruction_id => {
                    removeFromPrevInstructionIds(instruction_id, false)
                });
                getCookie('ownCards').split(',').forEach(instruction_id => {
                    console.log('ownCards:', instruction_id);
                    removeInstruction(instruction_id, false);
                });
            } catch (e) {
                /* setCookie('ownCards', JSON.stringify([]), 1);
                setCookie('receivedCards', JSON.stringify([]), 1); */
                console.error(e);
                console.log(document.cookie);
            }
        } else {
            initCookie();

            console.log(document.cookie);
        }


        console.log(`/${room_url}/${role_id}/swipe`);
        console.log(`/${room_url}/${role_id}/confirmation`);

        socket.subscribe(`/${room_url}/${role_id}/swipe`, receiveSwipedCard);
        socket.subscribe(`/${room_url}/${role_id}/confirmation`, receiveConfirmation);
        socket.send('/connect', role_id);
        window.addEventListener('beforeunload', () => {
            socket.send('/disconnect', JSON.stringify({ user_id, room_url }));
        })

        setRender(performance.now());
    }

    useEffect(() => {
        console.log('socket is ', socket);
        if (!r_isInitialized.current) init();

    }, [socket])

    const removeInstruction = (instruction_id, shouldRender = true) => {
        let _instructions = [...r_instructions.current];
        _instructions = _instructions.filter(v => v.instruction_id !== instruction_id);
        r_instructions.current = _instructions;
        if (!shouldRender) return;
        setRender(performance.now());
    }



    const sendSwipedCardToNextRoleIds = (instruction_id, next_role_ids) => {
        next_role_ids.forEach(next_role_id => {
            if (next_role_id === r_role_url.current) {
                receiveSwipedCard(JSON.stringify({ role_id: r_role_id.current, instruction_id }));
            } else {
                console.log(socket);
                console.log(socket.client.connected);

                socket.send(`/${r_room_url.current}/${next_role_id}/swipe`, JSON.stringify({ role_id: r_role_url.current, instruction_id }));
                r_unconfirmedUpdates.current[`${next_role_id}_${instruction_id}`] = setInterval(() => {
                    if (!socket.client.connected) {
                        console.error(`client is not connected while trying to send an extra update`);
                    }

                    console.error(`extra update sent to ${next_role_id} for instruction ${instruction_id} from ${r_role_url.current}`);
                    socket.send(`/${r_room_url.current}/${next_role_id}/swipe`, JSON.stringify({ role_id: r_role_id.current, instruction_id }));

                }, 500);
            }

        })
    }

    const receiveConfirmation = (json) => {
        try {
            let { instruction_id, role_id } = JSON.parse(json);
            console.log('receiveConfirmation', instruction_id, role_id);
            clearInterval(r_unconfirmedUpdates.current[`${role_id}_${instruction_id}`]);
            delete r_unconfirmedUpdates.current[`${role_id}_${instruction_id}`];
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
            console.log('sent confirmation to ', instruction_id, role_id);
            socket.send(`/${r_room_url.current}/${role_id}/confirmation`, JSON.stringify({ instruction_id, role_id: r_role_id.current }));

            if (r_receivedSwipes.current.indexOf(instruction_id) == -1) {
                r_receivedSwipes.current.push(instruction_id);
                removeFromPrevInstructionIds(instruction_id);
                addToCookie(instruction_id, `receivedCards`);
            } else {
                console.log('already received swipe!!!!', instruction_id);
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
        console.log('ENTER GAME', r_videos.current);

        Object.entries(r_videos.current).forEach(([instruction_id, video]) => {
            console.log('play', instruction_id, video);
            // video.play();
            // video.pause();
        })
        setFullscreen(true);

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
        const { instructions } = await joinRoom();
        console.log(instructions)
        r_receivedSwipes.current = [];
        r_instructions.current = instructions;
        initCookie();
        setRender(performance.now());
    }

    const startRestartTimer = useCallback(() => {
        r_restartTimer.current = setTimeout(restart, 3000)
    }, [])

    const cancelRestartTimer = useCallback(() => {
        clearTimeout(r_restartTimer.current)
    }, [])

    const addToOwnSwipes = useCallback((instruction_id) => {
        r_ownSwipes.current.push(instruction_id);
        addToCookie(instruction_id, `ownCards`)
    }, [])

    const Intro = () => {
        return <button className='centered uiText' onClick={enterGame}><span>Click Here To Start Your Date</span></button>
    }

    const swipe = useCallback(memoize((instruction) => {

    }), []);



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
                                        if (i > 5) return

                                        let zIndex = r_instructions.current.length - i;
                                        let margin = Math.max(0, i);
                                        return (
                                            <div key={instruction.instruction_id}
                                                className='card-offset'
                                                style={{ marginLeft: margin * 20, marginTop: margin * 20 }}>
                                                <Card
                                                    offset={i}
                                                    zIndex={zIndex}
                                                    instruction_id={instruction.instruction_id}
                                                    dataurl={instruction.type === 'video' ? r_videos.current[instruction.instruction_id] : ''}
                                                    text={instruction.text}
                                                    type={instruction.type}
                                                    timespan={instruction.timespan ? instruction.timespan : 0}
                                                    flip={instruction.prev_instruction_ids.length == 0}
                                                    waitYourTurn={waitYourTurn}
                                                    swipeAction={() => {
                                                        sendSwipedCardToNextRoleIds(instruction.instruction_id, instruction.next_role_ids);
                                                        setTimeout(() => {
                                                            removeInstruction(instruction.instruction_id);
                                                        }, 125);
                                                        addToOwnSwipes(instruction.instruction_id);
                                                        console.log(r_instructions.current);
                                                        if (r_instructions.current.length > 1 && r_instructions.current[1].type === 'video') {
                                                            let id = `${r_instructions.current[1].instruction_id}_video`;
                                                            console.log(id, document.querySelector(`#${id}`));
                                                            document.querySelector(`#${id}`).play();
                                                            document.querySelector(`#${id}`).pause();
                                                        }
                                                        console.log('next is video');
                                                    }}
                                                    video={r_videos.current[instruction.instruction_id]}
                                                ></Card>
                                            </div>

                                        )
                                    }
                                )
                            }
                            <span className='centered uiText' onTouchStart={startRestartTimer} onTouchEnd={cancelRestartTimer} onMouseDown={startRestartTimer} onMouseUp={cancelRestartTimer}>The End</span>
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