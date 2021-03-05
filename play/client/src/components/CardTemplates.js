import React, { useEffect, useRef, useState, useCallback } from 'react';
import Swipe from "./Swipe";

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

    useEffect(() => {
        if (!animate) return
        card.current.style.transition = `clip-path ${timespan}s`;
        card.current.setAttribute('class', 'animation start');
        setTimeout(() => {
            card.current.setAttribute('class', 'animation end');
        }, 125);
        setTimeout(() => {
            // window.alarm.play()
        }, timespan * 1000)

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


const VideoSide = ({ text, flip, swipeAction, dataurl, stop }) => {
    const r_video = useRef(false);
    const [url, setUrl] = useState();


    const play = useCallback((e) => {
        r_video.current.muted = false;
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
        r_video.current.play();

        setUrl(dataurl)
    }, [flip])
    return (
        <div className="front"
            onClick={play}
            onTouchStart={play}
        >
            {text != '' ?
                <video
                    className='video hidden'
                    ref={r_video}
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

    useEffect(() => {
        if (stopTimespan && stopwatch.current) {
            clearInterval(stopwatch.current);
        }
    }, [stopTimespan])


    useEffect(() => {
        if (!flip || !timespan) return;
        window.navigator.vibrate(200);

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
    }, [flip])

    return (
        <div className="front">

            <div className="text">
                {type !== 'do' ?
                    <div className="type">
                        {type}
                    </div> : null
                }
                <div>{text ? decodeSingleQuotes(text) : null}</div>
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



const NormalCard = ({ type, waitYourTurn, text, timespan, flip, canPlay, swipeAction, zIndex, dataurl }) => {
    const [spanCompleted, setSpanCompleted] = useState(false);
    let r_swipe = useRef();
    let r_stopVideo = useRef(false);
    let r_stopTimespan = useRef(false);

    useEffect(() => {
        if (flip) window.navigator.vibrate(100);

        if (!flip || !timespan) return;
        setTimeout(() => {
            setSpanCompleted(true);
            window.navigator.vibrate(200);
        }, timespan * 1000);
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


export { NormalCard, CardMasks }