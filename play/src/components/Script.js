import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from "react-router-dom";

import getData from '../helpers/getData';

import VisibleCards from './VisibleCards.js';
import EndCards from './EndCards.js';

var uniqid = require('uniqid');
let not_subscribed = true;

function Script({ _url, socket, user_id }) {
    const history = useHistory();
    let { script_id, room_id } = useParams();

    let { instructions, setInstructions } = useParams();


    async function initInstructions(role_id) {
        console.log("roleId", role_id);
        return await getData(`${_url.fetch}/script/${script_id}/${role_id}`).then(res => res.json()).then(res => console.log(res));
    }



    let setNextCard = (instruction) => {
    }

    let init = () => {
        console.log(socket);
        socket.subscribe(`/${user_id}/connected`, (data) => {
            data = JSON.parse(data);
            if (!data.success) {
                console.log('error');
                return;
            }
            console.log(data.instructions);
            setInstructions(data.instructions);
        })
        socket.send('/connect', JSON.stringify({ user_id, room_id, script_id }));
        window.addEventListener('beforeunload', () => {
            socket.send('/disconnect', JSON.stringify({ user_id, room_id }));
        })
        // initSocket();
        // initInstructions();
    }

    useEffect(() => {
        if (!room_id) {
            history.push(`${script_id}/${uniqid()}`)
        } else {
            if (socket && not_subscribed) {
                init();
                not_subscribed = false;
            }
            console.log(socket);
        }

    })

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