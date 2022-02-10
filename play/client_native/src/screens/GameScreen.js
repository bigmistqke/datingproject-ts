import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Card from "../components/Card";
// import Card from "../components/Card";
// import CardComposition from "../components/card/CardComposition";

import { Dimensions, Button, View, Text, Vibration } from 'react-native';
import styled from 'styled-components/native';
import Swipe from "../components/Swipe";
import { For, Show } from '../components/solid-like-components';
import { useStore } from "../store/Store";
import { measure, useAnimatedRef } from 'react-native-reanimated';
import { FlatList } from 'react-native-gesture-handler';


function Game({ design, instructions }) {
  const [state, actions] = useStore();

  let r_overlay = useRef();
  const aref = useAnimatedRef();

  const waitYourTurn = useCallback((reason) => {
    if (!reason) {
      return;
    }
    try {
      Vibration.vibrate(200);
    } catch (e) { console.error(e) }
  }, [r_overlay]);

  const Overlay = styled.View`
        position: absolute;
        top: 25%;
        left: 50%;
        /* transform: translate(-50%, -50%); */
        color: rgb(71, 70, 70);
        /* box-shadow: 0px 0px 50px rgba(0, 0, 0, 0.096); */
        background: rgb(239, 240, 240);
        font-family: Arial;
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
        font-family: arial;
        color: #03034e;
        background: transparent;
        border: none;
        width: 70%;
        text-align: center;
    `;


  const visible_instructions = useMemo(() => {
    if (!state.instructions) return []
    return state.instructions.slice(state.instruction_index,
      state.instruction_index + 5
    )
  },
    [state.instructions]
  )

  useEffect(() => {


  }, [])

  const Game = () => <>
    <View
      className="Cards"
      style={{
        height: "100%"
      }}
    >
      {visible_instructions.map((instruction, index) =>
        <Swipe
          key={instruction.instruction_id}
          margin={index}
          /* style={{
            elevation: 5 - index
          }} */
          pointerEvents={index === 0 ? "auto" : "none"}
          instruction={instruction}
        >
          <Card
            index={index}
            key={instruction.instruction_id}
            instruction_id={instruction.instruction_id}
            instruction={instruction}
            flip={instruction.prev_instruction_ids.length === 0}
            prev_instruction_ids={instruction.prev}
            instruction={instruction}
          />
        </Swipe>
      )}
      <End className='centered uiText'>The End</End>
    </View>
  </>

  return Game()
}

export default Game