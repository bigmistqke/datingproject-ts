import React, { useEffect, useState, useRef } from 'react';
import getData from '../helpers/getData';

import BubbleCanvas from "./BubbleCanvas";
/* let current = {};
const ENDPOINT = "https://socket.datingproject.net";
let socket = null; */


function decodeSingleQuotes(text) {
    return text.replace(/&#039;/g, "'");
}



const ScriptCard = (props) => {


    return <div /* ref={card}  */className="instruction" /* onClick={(e)=>{e.target.classList.toggle("flip")} }*/>
        {/* <div className="border"> */}
            <div className="front">
                <div className="text"><div className="type">{props.data.type != "empty" ? props.data.type: null}</div><div>{props.data.text ? decodeSingleQuotes(props.data.text) : null}</div></div>
                <img src={require('./grass.png')}  className="grass"></img>
                {props.data.type ? <BubbleCanvas type={props.data.type}></BubbleCanvas>: null}
            </div>
            <div className="back">
                <span className="text">{/* props.data.text ? decodeSingleQuotes(props.data.type) : */ null}</span>
                <img src={require('./grass.png')}  className="grass"></img>
                {props.data.type ? <BubbleCanvas type={"wait"}></BubbleCanvas>: null}
            </div>
        {/* </div> */}
       
            
        </div>
}

export default ScriptCard;