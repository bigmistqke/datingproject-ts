import React, { useEffect, useRef, useState } from 'react';
import Swipe from "./Swipe";
import Card from "./Card";
import BubbleCanvas from "./BubbleCanvas";

import { ReactComponent as Do } from '../svg/do.svg';
import { ReactComponent as Say } from '../svg/say.svg';
import { ReactComponent as Think } from '../svg/think.svg';
import { ReactComponent as Back } from '../svg/back.svg';
import { ReactComponent as Idle } from '../svg/idle.svg';

import decodeSingleQuotes from "../helpers/decodeSingleQuotes"

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
        console.log('animate this dude!!!!', timespan, card.current);
        card.current.style.transition = `clip-path ${timespan}s`;
        card.current.setAttribute('class', 'animation start');
        setTimeout(() => {
            card.current.setAttribute('class', 'animation end');
        }, 25);

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


const VideoSide = ({ text }) => {
    return (
        <div className="front">
            {text != '' ?
                <video
                    autoPlay={true}
                    muted={true}
                    src={`${window._url.fetch}${text}?time=${performance.now()}`}
                ></video> : null}
        </div>
    )
}


function FrontSide({ text, type, flip, timespan }) {

    const [stopWatch, setStopwatch] = useState(0);

    useEffect(() => {
        if (!flip || !timespan) return;
        let count = 0;
        let stopwatch = () => {
            let remaining_time = timespan - count;
            if (remaining_time > 60) {
                let minutes = Math.floor(remaining_time / 60);
                let seconds = remaining_time % 60;
                setStopwatch(`${minutes}m${seconds}`);
            } else {
                setStopwatch(remaining_time);
            }
            if (count == timespan) {
                setStopwatch()
                return;
            };
            count++;
            setTimeout(stopwatch, 1000);
        }
        stopwatch();
    }, [flip])

    return (
        <div className="front">
            <div className="type">
                {type == 'do' ? '' : type}
            </div>
            <div className="text">

                <div>{text ? decodeSingleQuotes(text) : null}</div>
            </div>
            {
                timespan == 0 ? null :
                    <div className="stopwatch">
                        {stopWatch}
                    </div>
            }
            {timespan == 0 ?
                <CardType type={type}></CardType> :
                <AnimatedCardType type={type} animate={flip && timespan} timespan={timespan}></AnimatedCardType>
            }

        </div>
    )
}
const BackSide = () => {
    return (
        <div className="back">
            <CardType type="back"></CardType>
        </div>
    )
}

const NormalCard = ({ type, waitYourTurn, text, timespan, flip, canPlay, swipeAction, zIndex, order }) => {
    const [spanCompleted, setSpanCompleted] = useState(false);

    useEffect(() => {
        if (!flip || !timespan) return;
        setTimeout(() => {
            setSpanCompleted(true);
            window.navigator.vibrate(200);
        }, timespan * 1000)
    }, [flip])

    useEffect(() => {
        console.log(zIndex, order, flip);
    }, [order])

    return (
        <Swipe
            canPlay={canPlay}
            waitYourTurn={waitYourTurn}
            swipeAction={swipeAction}
            canSwipe={timespan == 0 ? flip : spanCompleted}
            flip={flip}
            zIndex={zIndex}>
            <div className={`instruction ${type}`}>
                {flip ? type === 'video' ?
                    <VideoSide text={text}></VideoSide> :
                    <FrontSide text={text} type={type} timespan={timespan} flip={flip}></FrontSide> : null
                }
                <BackSide></BackSide>
            </div>
        </Swipe>);
}


export { NormalCard, CardMasks }