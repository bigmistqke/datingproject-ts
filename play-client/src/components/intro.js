import React, { useEffect, useState, useRef } from 'react';
import Swipe from "./Swipe";
import Card from "./Card";

function Intro({waiting}){
    let [intro_index, setIntro_index] = useState(0);
    const intro_sequence = [
        {type: "empty", text: "swipe to enter"}, 
        {type: "empty", text: "welcome to play.datingproject.net"},
        {type: "empty", text: "a roleplay for you and someone else"},
        {type: "empty", text: "swipe to invite your partner"},
        {type: "empty", text: "waiting for partner to join"},
    ]
    let cardTemplate = (data, i, flip)=>{
        return <Swipe key={data.card_id} swipeAction={() => {  }} zIndex={(i+1)} swiped={0} canSwipe={true} flip={flip} ><Card  data={data} ></Card></Swipe>;
    }

    let setNextWaitCard = (zIndex) => {
        let index = intro_sequence.length - zIndex;
        if(index < intro_sequence.length){
            intro_sequence[index].swiped = true;
        }
        setIntro_index(index);
    }

    const getWaitingCards = () => {
        let cards = [];

        intro_sequence.slice(0).reverse().map((data, i)=>{
            if(i == (intro_sequence.length - intro_index) - 1){
                return cardTemplate(data, i, true);
            }else{
                return cardTemplate(data, i, false);
            }
        }) 
    }

    return (<div>{waiting ? getWaitingCards() : null}</div>);

}

export default Intro;