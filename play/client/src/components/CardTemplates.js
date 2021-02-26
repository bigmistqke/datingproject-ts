import React from 'react';
import Swipe from "./Swipe";
import Card from "./Card";
import BubbleCanvas from "./BubbleCanvas";

import { ReactComponent as Do } from '../svg/do.svg';
import { ReactComponent as Say } from '../svg/say.svg';
import { ReactComponent as Think } from '../svg/think.svg';
import { ReactComponent as Back } from '../svg/back.svg';
import { ReactComponent as Idle } from '../svg/idle.svg';

import decodeSingleQuotes from "../helpers/decodeSingleQuotes"

const CardType = ({ type }) => {
    switch (type) {
        case 'do':
            return <Do ></Do>
        case 'say':
            return <Say></Say>
        case 'thought':
            return <Think ></Think>
        case 'back':
            return <Back ></Back>
        case 'idle':
            return <Idle></Idle>
        default:
            return <div></div>
    }
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


const FrontSide = ({ text, type }) => {
    return (
        <div className="front">
            <div className="type">
                {type}
            </div>
            <div className="text">

                <div>{text ? decodeSingleQuotes(text) : null}</div>
            </div>
            <CardType type={type}></CardType>
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

const NormalCard = ({ type, text, flip, canSwipe, canPlay, swipeAction, zIndex }) => {
    return (
        <Swipe
            canPlay={canPlay}
            swipeAction={swipeAction}
            canSwipe={canSwipe}
            flip={flip}
            zIndex={zIndex}>
            <div className={`instruction ${type}`}>
                {type === 'video' ?
                    <VideoSide text={text}></VideoSide> :
                    <FrontSide text={text} type={type}></FrontSide>
                }
                <BackSide></BackSide>
            </div>
        </Swipe>);
}


export { NormalCard }