import React, { useEffect, useState, useRef } from 'react';
import {NormalCard} from "./CardTemplates";

function IntroCards({waiting}){
    let [intro_index, setIntro_index] = useState(0);
    const intro_seq = [
        { text: "swipe to enter"}, 
        {text: "welcome to play.datingproject.net"},
        {text: "a roleplay for you and someone else"},
        {text: "swipe to invite your partner"},
        {text: "waiting for partner to join"},
    ]

    let setNextWaitCard = (zIndex) => {
        let index = intro_seq.length - zIndex;
        if(index == intro_seq.length){
            index = intro_seq.length - 2;
        }
        setIntro_index(index);
    }

    const getWaitingCards = () => {
        let cards = [];
        intro_seq.slice(0).reverse().map((data, i)=>{
            if(i == (intro_seq.length - intro_index) - 1) {
                cards.push(<NormalCard canPlay={true} canSwipe={true} key={i} text={data.text} type="empty" zIndex={i} flip={true} swipeAction={setNextWaitCard}></NormalCard>);
            }else{
                cards.push(<NormalCard canPlay={true} canSwipe={false} key={i}  text={data.text} type="empty" zIndex={i} flip={false} swipeAction={setNextWaitCard}></NormalCard>);
            }
        }) 
        return cards;
    }



    return (<div>{waiting ? getWaitingCards() : null}</div>);

}

export default IntroCards;