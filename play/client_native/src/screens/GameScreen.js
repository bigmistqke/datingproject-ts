import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Card from "../components/Card";

import { Dimensions, Button, View, Text, Vibration, Pressable } from 'react-native';
import styled from 'styled-components/native';
import Swipe from "../components/Swipe";
import { For, Show } from '../components/solid-like-components';
import { useStore } from "../store/Store";
import { measure, useAnimatedRef } from 'react-native-reanimated';

import FullScreenAndroid from 'react-native-fullscreen-chz';

import { AppState } from "react-native";

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

const End = styled.View`
        color: #03034e;
        background: transparent;
        border: none;
        width: 100%;
        height:100%;
        justify-content: center;
        align-items: center;
        font-size: 150px;
        z-index: 50;
        position:absolute;
        font-family: arial_rounded;
    `;


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

  const visible_instructions = useMemo(() => {
    if (!state.instructions) return []
    return state.instructions.slice(state.instruction_index,
      state.instruction_index + 3
    )
  },
    [state.instructions]
  )

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active" && state.mode === 'play')
        FullScreenAndroid.enable()
    });
    FullScreenAndroid.enable();
  }, [])

  const Game = () => <>
    <View
      className="Cards"
      style={{
        height: "100%",
      }}
    >
      {visible_instructions.map((instruction, index) =>
        <Swipe
          key={instruction.instruction_id}
          margin={index}
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
          />
        </Swipe>
      )}
      <Show when={state.instruction_index >= state.instructions.length - 3}>
        <End>


          <Pressable
            onLongPress={actions.endGame}
            style={{
              width: "75%",
              fontFamily: "arial_rounded",
              color: "#03034e",
            }}
          >
            <Text
              style={{
                fontSize: 100,
                fontFamily: "arial_rounded",
                color: "#03034e",
                textAlign: "center"
              }}>The End</Text>
          </Pressable>
        </End>
      </Show>

    </View>
  </>

  return Game()
}

export default Game