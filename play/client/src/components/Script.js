import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from "react-router-dom";

import { NormalCard } from "./CardTemplates";
import getData from '../helpers/getData';
var uniqid = require('uniqid');
let not_subscribed = true;

function Script({ socket, user_id }) {
    const history = useHistory();
    let { script_id, room_id } = useParams();

    let [instructions, setInstructions] = useState();
    let r_instructions = useRef();
    let [index, setIndex] = useState(0);
    let [swipes, setSwipes] = useState([]);
    let r_swipes = useRef([]);


    async function initInstructions(role_id) {
        console.log("roleId", role_id);
        return await getData(`${window._url.fetch}/script/${script_id}/${role_id}`).then(res => res.json()).then(res => console.log(res));
    }



    let setNextCard = (instruction) => {
    }

    let init = () => {
        console.log(socket);
        socket.subscribe(`/usr/${user_id}/connected`, (data) => {
            console.log('hallo?');
            data = JSON.parse(data);
            if (!data.success) {
                console.log('error');
                return;
            }
            console.log(data.instructions);
            setInstructions(data.instructions);
            r_instructions.current = data.instructions;
            socket.subscribe(`/${room_id}/swipe/${data.role_id}`, receiveSwipe);
        })
        socket.send('/connect', JSON.stringify({ user_id, room_id, script_id }));
        window.addEventListener('beforeunload', () => {
            socket.send('/disconnect', JSON.stringify({ user_id, room_id }));
        })
    }

    useEffect(() => {
        if (!room_id) {
            history.push(`${script_id}/${uniqid()}`)
        } else {
            if (socket && not_subscribed) {
                init();
                not_subscribed = false;
            }
        }
    })



    let addToSwipes = (id) => {
        r_swipes.current.push(id);
        setSwipes([id, ...swipes]);
    }

    let removeFromSwipes = (id) => {
        let _swipes = [...r_swipes.current];
        _swipes = _swipes.filter(v => v !== id);
        r_swipes.current = _swipes;
        setSwipes(_swipes);
    }

    let sendSwipe = (instruction_id, next_instruction_role) => {
        socket.send(`/${room_id}/swipe/${next_instruction_role}`, JSON.stringify(instruction_id));
    }

    let receiveSwipe = (data) => {

        try {
            let id = JSON.parse(data);
            let _is = [...r_instructions.current];
            console.log(_is);
            let _i = _is.find(v => {
                console.log(v.prev_instruction_id, id);
                return v.prev_instruction_id.indexOf(id) != -1;
            });
            console.log(_i, id);
            _i.prev_instruction_id.splice(_i.prev_instruction_id.indexOf(id), 1);
            r_instructions.current = _is;
            setInstructions(_is);
        } catch (e) {
            console.error(e)
        }
    }



    return (
        <div className="Cards fill">
            {
                instructions ? [...instructions].reverse().map(
                    (instruction, i) => {
                        let visible = false;
                        if (instruction.prev_instruction_id.length == 0) visible = true;
                        return <NormalCard
                            style={{ zIndex: i }}
                            canSwipe={visible}
                            text={instruction.text}
                            type={instruction.type}
                            flip={visible}
                            swipeAction={() => {
                                sendSwipe(instruction.instruction_id, instruction.next_instruction_role);
                                setTimeout(() => {
                                    removeFromSwipes(instruction.prev_instruction_id)
                                }, 1000)
                            }}
                        ></NormalCard>
                    }
                ) : null
            }
        </div>
    )

}

export default Script