import React from 'react';
import Swipe from "./Swipe";
import Card from "./Card";
import BubbleCanvas from "./BubbleCanvas";

import decodeSingleQuotes from "../helpers/decodeSingleQuotes"


const VideoSide = ({ text }) => {
    return <div className="front">

        <video autoPlay={true} muted={true} src={`${window._url.fetch}${text}?time=${performance.now()}`}></video>
    </div >
}

const CardSide = ({ side, text, type }) => {
    return <div className={side}>
        <div className="text"><div className="type">{(type !== "empty" && type !== "back") ? type : null}</div><div>{text ? decodeSingleQuotes(text) : null}</div></div>
        <img alt="" src={require('./grass.png')} className="grass"></img>
        <BubbleCanvas type={type}></BubbleCanvas>
    </div>
}

const _NormalCard = ({ type, text }) => {
    return <div className="instruction">
        {type === 'video' ?
            <VideoSide text={text}></VideoSide> :
            <CardSide side="front" text={text} type={type}></CardSide>
        }
        <CardSide side="back" type="back"></CardSide>
    </div>
}

const _DoubleSidedCard = ({ text_front, text_back }) => {
    return <div className="instruction">
        i
        <CardSide side="front" text={text_front} type="say"></CardSide>
        <CardSide side="back" text={text_back} type="say"></CardSide>
    </div>
}

const NormalCard = ({ type, text, flip, canSwipe, canPlay, swipeAction }) => {
    return <Swipe canPlay={canPlay} swipeAction={swipeAction} canSwipe={canSwipe} flip={flip} >
        <_NormalCard type={type} text={text} ></_NormalCard>
    </Swipe>;
}


const DoubleSidedCard = ({ text_front, text_back, zIndex, flip, canSwipe, canPlay, swipeAction }) => {
    return <Swipe canPlay={canPlay} swipeAction={() => { swipeAction(zIndex) }} zIndex={zIndex + 1} canSwipe={canSwipe} flip={flip} >
        <_DoubleSidedCard text_front={text_front} text_back={text_back}></_DoubleSidedCard>
    </Swipe>;
}

export { NormalCard, DoubleSidedCard }