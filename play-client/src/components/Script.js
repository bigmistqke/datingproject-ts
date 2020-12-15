import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from "react-router-dom";
import socketIOClient from "socket.io-client";
import getData from '../helpers/getData';
import IntroCards from './IntroCards.js';
import VisibleCards from './VisibleCards.js';
import EndCards from './EndCards.js';
import Log from './Log.js';

var uniqid = require('uniqid');

// const ENDPOINT = "https://socket.datingproject.net";
const ENDPOINT = "localhost:4001";



function Script() {
    return (
        <div className="Cards fill">
            <Log logText={logText}></Log>
            <IntroCards waiting={waiting}></IntroCards>
            <VisibleCards
                canPlay={canPlay}
                instructions={instructions}
                index_instructions={index_instructions}
                prev_instruction_ids={prev_instruction_ids}
                role_id={role_id}
                swipeAction={setNextCard}
            ></VisibleCards>
            <EndCards></EndCards>
        </div>)

}

export default Script