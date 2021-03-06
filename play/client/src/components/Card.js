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


const VideoSide = ({ text, flip, swipeAction, dataurl, stop }) => {
    const r_video = useRef(false);
    const [url, setUrl] = useState();


    const play = useCallback((e) => {
        let video = r_video.current;
        if (!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2))
            video.play();
        video.muted = false;
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
    const [formattedText, setFormattedText] = useState()

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

        return function cleanup() {
            clearInterval(stopwatch.current);
        }
    }, [flip])

    useEffect(() => {
        setFormattedText(formatText(text));
    }, [text])


    const formatText = (text) => {
        let formattedText = [{ type: 'normal', text }];
        let split = formattedText[0].text.split(`Swipe`);

        // find Swipe-recommendations

        if (split.length > 1 && split[0] != '') {

            formattedText = [
                { type: 'normal', text: split[0] },
                { type: 'swipe', text: `Swipe${split[1]}` }
            ];
        }


        // match []
        // const regex = /\[(?<=\[)(.*?)(?=\])\][.!?\\-]?/g
        const regex = /[\["](?<=[\["])(.*?)(?=[\]"])[\]"][.!?\\-]?/g

        let matches = text.match(regex);

        if (matches) {
            for (let i = matches.length - 1; i >= 0; i--) {
                let split = formattedText.shift().text.split(`${matches[i]}`);

                formattedText = [
                    { type: 'normal', text: split[0] },
                    { type: 'choice', text: `${matches[i]}` },
                    { type: 'normal', text: split[1] },
                    ...formattedText
                ];
            }
        }

        return formattedText;
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
                    ({ type, text }) =>
                        type === 'normal' ? text : <span className={type} key={text}>{text}</span>
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



const Card = ({ type, waitYourTurn, text, timespan, flip, canPlay, swipeAction, zIndex, dataurl }) => {
    const [spanCompleted, setSpanCompleted] = useState(false);
    let r_swipe = useRef();
    let r_stopVideo = useRef(false);
    let r_stopTimespan = useRef(false);

    useEffect(() => {
        if (flip) window.navigator.vibrate(100);

        if (!flip || !timespan) return;
        let timer = setTimeout(() => {
            setSpanCompleted(true);
            window.navigator.vibrate(200);
            swipeAction();
        }, timespan * 1000);

        return function cleanup() {
            clearInterval(timer);
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