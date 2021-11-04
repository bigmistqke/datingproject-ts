import React, { useEffect, useState, useRef, useCallback } from 'react';
import Card from "../components/Card";
import { Dimensions, Button, View, Text, Vibration } from 'react-native';
import styled from 'styled-components/native';
import Swipe from "../components/Swipe";


import isMobile from "is-mobile";

function Game({ instructions, swipeAction }) {

    let screen_dimensions_ref = useRef({
        x: Dimensions.get('window').width,
        y: Dimensions.get('window').height
    }).current;

    let card_dimensions_ref = useRef({
        y: screen_dimensions_ref.y - 0.05 * screen_dimensions_ref.y,
        x: (screen_dimensions_ref.y - 0.05 * screen_dimensions_ref.y) * 0.5588507940957915
    }).current;

    const [visibleInstructions, setVisibleInstructions] = useState([]);

    let [designs, setDesigns] = useState({});

    let r_overlay = useRef();

    const waitYourTurn = useCallback((reason) => {
        if (!reason) {
            // r_overlay.current.classList.add('hidden')
            return;
        }
        try {
            Vibration.vibrate(200);
        } catch (e) { console.error(e) }
        console.log("REASON WAIT YOUR TURN IS ", reason);
        // r_overlay.current.children[0].innerHTML = reason;
        // r_overlay.current.classList.remove('hidden');
    }, [r_overlay]);

    const Overlay = styled.View`
        position: absolute;
        top: 25%;
        left: 50%;
        /* transform: translate(-50%, -50%); */
        color: rgb(71, 70, 70);
        box-shadow: 0px 0px 50px rgba(0, 0, 0, 0.096);
        background: rgb(239, 240, 240);
        font-family: Arial Rounded MT Bold;
        border-radius: 50px;
        padding-left: 37.5px;
        padding-right: 37.5px;
        padding-top: 25px;
        padding-bottom: 25px;
        line-height: 21pt;
        font-size: 16pt;
        z-index: 10;
        text-align: center;
        &.hidden{
            display: none
        }
    `;

    const End = styled.Text`
        font-size: 5px;
        font-family: arial_rounded;
        color: #03034e;
        background: transparent;
        border: none;
        width: 70%;
        text-align: center;
    `;

    useEffect(() => {
        setVisibleInstructions(instructions.slice(0,
            instructions.length > 5 ? 5 : instructions.length
        ).reverse())
        // setVisibleInstructions(instructions);
    }, [instructions])


    const Game = () => <>
        {/* <Overlay ref={r_overlay} onClick={hideOverlay} className='overlay hidden'>
            <Text>Wait Your Turn</Text>
        </Overlay> */}
        <View className="Cards">
            {
                visibleInstructions.map(
                    (instruction, i) => {
                        let zIndex = instructions.length - i;
                        let margin = visibleInstructions.length - i - 1;
                        return (
                            <Swipe
                                screen_dimensions={screen_dimensions_ref}
                                card_dimensions={card_dimensions_ref}
                                key={instruction.instruction_id}
                                waitYourTurn={waitYourTurn}
                                onSwipe={() => swipeAction(instruction)}
                                canSwipe={i === (instructions.length - 1)}
                                flip={
                                    !instruction.prev_instruction_ids ||
                                    instruction.prev_instruction_ids.length == 0
                                }
                                margin={margin}
                            >
                                <Card
                                    card_dimensions={card_dimensions_ref}
                                    alarm={instruction.sound ? playAlarm : false}
                                    offset={i}
                                    zIndex={zIndex}
                                    instruction_id={instruction.instruction_id}
                                    text={instruction.text}
                                    type={instruction.type}
                                    timespan={instruction.timespan ? instruction.timespan : 0}
                                    designs={designs}
                                    key={instruction.instruction_id}
                                >
                                    {instruction.text}
                                </Card>
                            </Swipe>


                        )
                    }
                )
            }
            {
                instructions.length < 2 ?
                    <End className='centered uiText'>The End</End> :
                    null
            }
        </View>
    </>

    return Game()
}

export default Game