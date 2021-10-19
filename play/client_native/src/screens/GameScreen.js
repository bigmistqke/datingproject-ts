import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { useParams, useHistory } from "react-router-dom";
import Card from "../components/Card";
/* import getData from '../helpers/getData';
import memoize from "fast-memoize"; */

import isMobile from "is-mobile";

function Game({ instructions, swipeAction }) {


    let [designs, setDesigns] = useState({});

    let r_overlay = useRef();

    const waitYourTurn = useCallback((reason) => {
        if (!reason) {
            r_overlay.current.classList.add('hidden')
            return;
        }
        try {
            window.navigator.vibrate(200);
        } catch (e) {
            console.error(e);
        }
        r_overlay.current.children[0].innerHTML = reason;
        r_overlay.current.classList.remove('hidden');
    }, [r_overlay]);

    const hideOverlay = useCallback(() => {
        r_overlay.current.classList.add('hidden');
    }, [])

    const enterGame = () => {
        setFullscreen(true);
        initAlarm();
        if (r_isMobile.current) {
            try {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(e => console.error(e));

                } else if (elem.webkitRequestFullscreen) { /* Safari */
                    elem.webkitRequestFullscreen().catch(e => console.error(e));
                } else if (elem.msRequestFullscreen) { /* IE11 */
                    elem.msRequestFullscreen().catch(e => console.error(e));
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    const restart = async () => {
        r_instructions.current = [];
        // setRender(performance.now());

        const { instructions } = await joinRoom();
        r_receivedSwipes.current = [];
        r_instructions.current = instructions;
        // initCookie();
        // setRender(performance.now());
    }

    const refetch = async () => {
        const { instructions } = await joinRoom();
        r_instructions.current = instructions;
        // initCookie();
        // setRender(performance.now());
    }

    const addToOwnSwipes = useCallback((instruction_id) => {
        r_ownSwipes.current.push(instruction_id);
        // addToCookie(instruction_id, `ownCards`)
    }, [])


    /*     const swipeAction = (instruction) => {
            sendSwipedCardToNextRoleIds(instruction.instruction_id, instruction.next_role_ids);
            if (r_instructions.current.length === 1) {
                sendFinished();
            }
            setTimeout(() => {
                removeInstruction(instruction.instruction_id);
            }, 125);
            addToOwnSwipes(instruction.instruction_id);
            if (r_instructions.current.length > 1 && r_instructions.current[1].type === 'video') {
                let id = `${r_instructions.current[1].instruction_id}_video`;
                document.querySelector(`#${id}`).play();
                document.querySelector(`#${id}`).pause();
            }
        } */

    const Game = () => <>
        <div ref={r_overlay} onClick={hideOverlay} className='overlay hidden'><span>Wait Your Turn</span></div>
        <div className="Cards">
            {
                instructions.map(
                    (instruction, i) => {
                        if (i > 5) return null
                        let zIndex = instructions.length - i;
                        let margin = Math.max(0, i);
                        return (
                            <div key={instruction.instruction_id}
                                className='card-offset'
                                style={{ marginLeft: margin * 20, marginTop: margin * 20 }}>
                                <Card
                                    alarm={instruction.sound ? playAlarm : false}
                                    offset={i}
                                    zIndex={zIndex}
                                    instruction_id={instruction.instruction_id}
                                    // dataurl={instruction.type === 'video' ? r_videos.current[instruction.instruction_id] : ''}
                                    text={instruction.text}
                                    type={instruction.type}
                                    timespan={instruction.timespan ? instruction.timespan : 0}
                                    flip={instruction.prev_instruction_ids.length == 0}
                                    waitYourTurn={waitYourTurn}
                                    swipeAction={() => { swipeAction(instruction) }}
                                    video={r_videos.current[instruction.instruction_id]}
                                    designs={designs}
                                ></Card>
                            </div>

                        )
                    }
                )
            }
            {
                r_instructions.current.length < 2 ?
                    <span className='centered uiText'>Het<br></br>Einde</span> :
                    null
            }
        </div>
    </>

    return Game()
}

export default Game