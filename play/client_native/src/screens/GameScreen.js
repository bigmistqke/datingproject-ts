import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Card from "../components/Card";
// import Card from "../components/Card";
// import CardComposition from "../components/card/CardComposition";

import { Dimensions, Button, View, Text, Vibration } from 'react-native';
import styled from 'styled-components/native';
import Swipe from "../components/Swipe";
import { For, Show } from '../components/solid-like-components';
import { useStore } from "../store/Store";


function Game({ design, instructions }) {
  const [state, actions] = useStore();

  let r_overlay = useRef();

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

    if (!state.instructions) {

      return [];
    }
    return state.instructions.slice(0,
      state.instructions.length < 10 ?
        state.instructions.length :
        10
    ).reverse()
  },
    [state.instructions]
  )




  const Game = () => <>
    {/* <Overlay ref={r_overlay} onClick={hideOverlay} className='overlay hidden'>
      <Text>Wait Your Turn</Text>
    </Overlay> */}
    <View
      className="Cards"
      style={{
        backgroundColor: "red",
        height: "100%"
      }}
    >
      {
        state.instructions.map((instruction, index) =>
          <Show
            when={index >= state.instruction_index && index <= state.instruction_index + 8}
            key={instruction.instruction_id}
          >
            <Swipe
              onSwipe={() => {
                actions.swipe(instruction);
              }}
              can_swipe={true}
              margin={index - state.instruction_index}
              style={{
                elevation: 5 - index - state.instruction_index
              }}
              pointerEvents={index - state.instruction_index === 0 ? "auto" : "none"}
              instruction={instruction}
            >
              <Card
                key={instruction.instruction_id}
                instruction_id={instruction.instruction_id}
                flip={instruction.prev_instruction_ids.length === 0}
                instruction={instruction}
                index={index - state.instruction_index}
              />
            </Swipe>
          </Show>

        )
      }
      {/*  <For each={state.instructions}>{(instruction, i) =>
        // <Show when={i < 5} key={instruction.instruction_id}>
        <Card
          key={instruction.instruction_id}
          instruction_id={instruction.instruction_id}
          canSwipe={i === (instructions.length - 1)}
          flip={instruction.prev_instruction_ids.length === 0}
          margin={i}
          index={i}
          onSwipe={(_instruction) => {
            actions.swipe(_instruction);
          }}
          instruction={instruction}
        />
        // </Show>

      }</For> */}
      <Show when={state.instructions.length < 2}>
        <End className='centered uiText'>The End</End>
      </Show>
    </View>
  </>

  return Game()
}

export default Game