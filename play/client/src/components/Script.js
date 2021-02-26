import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from "react-router-dom";

import { NormalCard } from "./CardTemplates";
import getData from '../helpers/getData';

var uniqid = require('uniqid');
let not_subscribed = true;

function Script({ socket, user_id }) {
    const history = useHistory();
    let { role_url } = useParams();

    let [index, setIndex] = useState(0);
    let [swipes, setSwipes] = useState([]);
    let r_swipes = useRef([]);

    let [instructions, setInstructions] = useState();
    let r_instructions = useRef();
    let r_room_id = useRef('');
    let r_role_id = useRef('');

    let init = async () => {
        if (!socket) return
        // get data via express
        const result = await fetch(`${window._url.fetch}/api/joinRoom/${role_url}`);
        if (!result) {
            console.error('could not fetch instructions: double check the url');
            return false;
        }

        const { instructions, room_id, role_id } = await result.json();
        r_instructions.current = instructions;
        setInstructions(performance.now());

        r_room_id.current = room_id;
        r_role_id.current = role_id;

        socket.subscribe(`/${room_id}/${role_id}/swipe`, receiveSwipe)

        window.addEventListener('beforeunload', () => {
            socket.send('/disconnect', JSON.stringify({ user_id, room_id }));
        })
    }

    useEffect(() => {
        init();
    }, [socket])



    let addToSwipes = (instruction_id) => {
        r_swipes.current.push(instruction_id);
        setSwipes([instruction_id, ...swipes]);
    }

    let removeFromSwipes = (instruction_id) => {
        let _swipes = [...r_swipes.current];
        _swipes = _swipes.filter(v => v !== instruction_id);
        r_swipes.current = _swipes;
        setSwipes(_swipes);
    }

    let sendSwipe = (instruction_id, next_role_ids) => {
        next_role_ids.forEach(next_role_id => {
            socket.send(`/${r_room_id.current}/${next_role_id}/swipe`, JSON.stringify(instruction_id));
        })
    }

    let receiveSwipe = (json) => {
        try {
            let received_id = JSON.parse(json);

            let _instructions = [...r_instructions.current];
            let _instruction = _instructions.find(v => {
                return v.prev_instruction_ids.indexOf(received_id) != -1
            });

            if (!_instruction) console.error('could not find card');
            if (typeof prev_instruction_ids === 'object') {
                // _instruction.prev_instruction_id
                _instruction.prev_instruction_ids.splice(
                    _instruction.prev_instruction_ids.indexOf(received_id), 1);
            } else {

            }
            _instruction.prev_instruction_ids.splice(
                _instruction.prev_instruction_ids.indexOf(received_id), 1);

            r_instructions.current = _instructions;
            setInstructions(performance.now());
        } catch (e) {
            console.error(e)
        }
    }



    return (
        <div className="Cards">
            {
                r_instructions.current ? [...r_instructions.current].map(
                    (instruction, i) => {
                        if (i > r_swipes.current.length + 3 || i < r_swipes.current.length - 2) return
                        i = r_swipes.current.length - i;

                        return (
                            <NormalCard
                                zIndex={i}
                                key={instruction.instruction_id}
                                text={instruction.text}
                                type={instruction.type}
                                canSwipe={instruction.prev_instruction_ids.length == 0}
                                flip={instruction.prev_instruction_ids.length == 0}
                                swipeAction={() => {
                                    sendSwipe(instruction.instruction_id, instruction.next_role_ids);
                                    setTimeout(() => {
                                        addToSwipes(instruction.instruction_id)
                                        removeFromSwipes(instruction.prev_instruction_ids)
                                    }, 1000)
                                }}
                            ></NormalCard>
                        )
                    }
                ) : null
            }
        </div >
    )

}

export default Script