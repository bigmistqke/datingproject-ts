import React, { useEffect, useRef, useState, useCallback } from 'react';
import Swipe from "./Swipe";
import memoize from "fast-memoize";


import { ReactComponent as Do } from '../svg/do.svg';
import { ReactComponent as Say } from '../svg/say.svg';
import { ReactComponent as Think } from '../svg/think.svg';
import { ReactComponent as Back } from '../svg/back.svg';
import { ReactComponent as Idle } from '../svg/idle.svg';

import decodeSingleQuotes from "../helpers/decodeSingleQuotes"

import enableInlineVideo from 'iphone-inline-video';
import videojs from 'video.js'

const CardMasks = () => {
    return (
        <div style={{ position: 'absolute', display: 'none' }}>
            <Do id="do_mask"></Do>
            <Say id="say_mask"></Say>
            <Think id="think_mask"></Think>
            <Idle id="idle_mask"></Idle>
            <Back id="back_mask"></Back>
        </div>
    )
}


const CardType = ({ type, animate, timespan }) => {
    let card = useRef(false);

    let r_animationEnd = useRef();

    useEffect(() => {
        if (!animate) return
        card.current.style.transition = `clip-path ${timespan}s`;
        card.current.setAttribute('class', 'animation start');
        r_animationEnd.current = setTimeout(() => {
            if (card.current)
                card.current.setAttribute('class', 'animation end');
        }, 125);

    }, [animate])



    switch (type) {
        case 'do':
            return <Do ref={card}></Do>
        case 'say':
            return <Say ref={card} ></Say>
        case 'think':
            return <Think ref={card} ></Think>
        case 'back':
            return <Back ref={card}></Back>
        case 'idle':
            return <Idle ref={card}></Idle>
        default:
            return <div></div>
    }
}

const AnimatedCardType = ({ type, animate, timespan }) => {
    return (
        <div>
            <CardType animate={animate} timespan={timespan} type={type}></CardType>
            <CardType type={type}></CardType>
        </div>
    )
}


const VideoSide = ({ text, flip, swipeAction, dataurl, stop, instruction_id }) => {
    const r_video = useRef(false);
    const [url, setUrl] = useState();


    const play = useCallback((e) => {
        console.log('this happens');
        let video = r_video.current;
        if (!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2))
            video.play();
        setTimeout(() => {
            video.removeAttribute('muted');
        }, 0)
    }, [])

    useEffect(() => {
        if (!stop) return;
        r_video.current.pause();
    }, [stop])

    useEffect(() => {
        if (!flip) return;

        r_video.current.addEventListener('ended', () => {
            swipeAction();

        })

        r_video.current.classList.remove('hidden');
        setTimeout(() => {
            r_video.current.play();
        }, 0)
        /*         setTimeout(() => {
                    r_video.current.removeAttribute('muted');
                    r_video.current.volume = 1;
                }, 50) */


        setUrl(dataurl)
    }, [flip])
    return (
        <div className="front"
            onClick={play}
        >
            {text != '' ?
                <video
                    className="video hidden"
                    id={`${instruction_id}_video`}
                    ref={r_video}
                    // muted
                    playsInline
                    src={dataurl.src}
                >
                </video> : null
            }
        </div>
    )
}


function FrontSide({ text, type, flip, timespan, stopTimespan }) {

    const [remainingTime, setRemainingTime] = useState(0);
    const stopwatch = useRef(false);
    const [formattedText, setFormattedText] = useState()

    useEffect(() => {
        if (stopTimespan && stopwatch.current) {
            clearInterval(stopwatch.current);
        }

    }, [stopTimespan])


    useEffect(() => {
        if (!flip || !timespan) return;
        try {
            window.navigator.vibrate(200);
        } catch (e) {
            console.error(e);
        }

        let count = 0;
        stopwatch.current = setInterval(() => {
            let remaining_time = timespan - count;
            if (remaining_time > 60) {
                let minutes = Math.floor(remaining_time / 60);
                let seconds = remaining_time % 60;
                setRemainingTime(`${minutes}m${seconds}`);
            } else {
                setRemainingTime(remaining_time);
            }
            if (count == timespan) {
                setRemainingTime();
                clearInterval(stopwatch.current);
                return;
            };
            count++;
        }, 1000);

        return function cleanup() {
            clearInterval(stopwatch.current);
        }
    }, [flip])

    useEffect(() => {
        let _formattedText = formatText(text);
        console.log(_formattedText);
        setFormattedText(_formattedText);

    }, [text])


    const formatText = (_text) => {
        let _formattedText = [{ type: 'normal', text: _text }];
        let split = _formattedText[0].text.split(`Swipe`);

        // find Swipe-recommendations

        if (split.length > 1 && split[0] != '') {

            _formattedText = [
                { type: 'normal', text: split[0] },
                { type: 'swipe', text: `Swipe${split[1]}` }
            ];
        }

        const regex = /[\["](.*?)[\]"][.!?\\-]?/g

        let matches = _text.match(regex);

        if (matches) {
            for (let i = matches.length - 1; i >= 0; i--) {
                let split = _formattedText.shift().text.split(`${matches[i]}`);

                _formattedText = [
                    { type: 'normal', text: split[0] },
                    { type: 'choice', text: `${matches[i]}` },
                    { type: 'normal', text: split[1] },
                    ..._formattedText
                ];
            }
        }

        return _formattedText;
    }

    return (
        <div className="front">
            {/* <div class='swipe_reminder'>swipe when you finished your action</div> */}
            <div className="text">
                {type !== 'do' ?
                    <div className="type">
                        {type}
                    </div> : null
                }
                <div>{formattedText ? formattedText.map(
                    ({ type, text }) => {
                        console.log(type, text);
                        return type === 'normal' ?
                            text :
                            <span className={type} key={text}>{text}</span>

                    }
                ) : null}</div>
            </div>
            {
                timespan == 0 ? null :
                    <div className="stopwatch">
                        {remainingTime}
                    </div>
            }
            {timespan == 0 ?
                <CardType type={type} ></CardType> :
                <AnimatedCardType type={type} animate={flip && timespan} timespan={timespan}></AnimatedCardType>
            }

        </div>
    )
}
const BackSide = () => {
    return (
        <div className="back">
            <div className="wait">
                <div>wait</div>
            </div>
            <CardType type="back"></CardType>
        </div>
    )
}



const Card = ({ instruction_id, type, waitYourTurn, text, timespan, flip, canPlay, swipeAction, zIndex, dataurl, video }) => {
    const [spanCompleted, setSpanCompleted] = useState(false);
    let r_swipe = useRef();
    let r_stopVideo = useRef(false);
    let r_stopTimespan = useRef(false);

    useEffect(() => {
        if (flip) {
            try {
                window.navigator.vibrate(100)
            } catch (e) {
                console.error(e);
            }
        };

        if (!flip || !timespan) return;
        let timer = setTimeout(() => {
            setSpanCompleted(true);
            try {
                window.navigator.vibrate(200)
            } catch (e) {
                console.error(e);
            }
            swipeAction();
        }, timespan * 1000);

        return function cleanup() {
            clearTimeout(timer);
        }
    }, [flip])

    return (
        <Swipe
            canPlay={canPlay}
            ref={r_swipe}
            waitYourTurn={waitYourTurn}
            swipeAction={() => {
                swipeAction();
                if (type === 'video') {
                    r_stopVideo.current = true;
                }
                if (timespan) {
                    r_stopTimespan.current = true;
                }
            }}
            canSwipe={window.isUnsafe ? flip : type !== 'video' ? timespan == 0 ? flip : spanCompleted : null}
            flip={flip}
            zIndex={zIndex}>
            <div className={`instruction instruction--${type}`}>
                {type === 'video' ?
                    <VideoSide
                        text={text}
                        flip={flip}
                        instruction_id={instruction_id}
                        swipeAction={() => {
                            if (type === 'video') { r_swipe.current.videoDone() };
                            swipeAction()
                        }}
                        dataurl={dataurl}
                        stop={r_stopVideo.current}></VideoSide> :
                    <FrontSide
                        text={text}
                        type={type}
                        timespan={timespan}
                        flip={flip}
                        stop={r_stopTimespan.current}
                    ></FrontSide>
                }
                <BackSide></BackSide>
            </div>
        </Swipe>);
}


export default Card