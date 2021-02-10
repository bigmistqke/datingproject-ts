import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from "react-router-dom";
import socketIOClient from "socket.io-client";


import getData from '../helpers/getData';

import VisibleCards from './VisibleCards.js';
import EndCards from './EndCards.js';

var uniqid = require('uniqid');


function Script({ _url }) {
    const history = useHistory();
    let { script_id, pair_id } = useParams();

    let { instructions, setInstructions } = useParams();


    async function initInstructions(role_id) {
        console.log("roleId", role_id);
        return await getData(`${_url.fetch}/script/${script_id}/${role_id}`).then(res => res.json()).then(res => console.log(res));
    }



    let setNextCard = (instruction) => {
    }

    let init = () => {
        // initSocket();
        // initInstructions();
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