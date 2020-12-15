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
    const history = useHistory();
    let { script_id, pair_id } = useParams();

    let { instructions, setInstructions } = useParams();

    var socket = useRef();

    async function initInstructions(role_id) {
        return await getData(`https://fetch.datingproject.net/play/${script_id}/${role_id}`).then(res => res.json());
    }

    async function initSocket() {

        socket.current = socketIOClient(ENDPOINT, {
            transports: ['websocket', 'polling']
        });
    }

    let setNextCard = (instruction) => {
    }

    let init = () => {
        initSocket();
        initInstructions();
    }


    useEffect(() => {
        setTimeout(() => {
            init();
        }, 1000);
    }, []);

    return (
        <div className="Cards fill">
            {/* <Log logText={""}></Log>
            <IntroCards waiting={""}></IntroCards> */}
            <VisibleCards
                instructions={instructions}
                swipeAction={setNextCard}
            ></VisibleCards>
            <EndCards></EndCards>
        </div>)

}

export default Script