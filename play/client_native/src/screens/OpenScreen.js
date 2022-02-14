import QRCodeScanner from 'react-native-qrcode-scanner';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { Keyboard, Pressable, Button } from 'react-native';
import { Show } from '../components/solid-like-components';

import Text from "../components/AppText";

import { useStore } from "../store/Store"

function OpenScreen({ onRead }) {
  const [state, actions] = useStore();

  const input_ref = useRef();
  const game_url_ref = useRef();

  const TextInput = styled.TextInput`
    position: relative;
    z-index:99;
    background:white;
    margin: 10px;
    /* border-radius: 50px; */
  `
  const View = styled.View`
    position:relative;
  `

  /*   useEffect(() => {
      if (input_ref.current) {
        input_ref.current.focus();
      }
    }, [input_ref])
   */
  return (<View style={{
    height: "100%",
    justifyContent: "center"
  }}>
    <View
      style={{
        flex: 1,
        justifyContent: "center"
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: "center"
        }}>
        <Pressable
          onPress={() => actions.initGame(state.previous_game_id)}
          title="yes"
          style={{
            height: 75,
            borderBottomColor: "white",
            backgroundColor: "white",
            color: "black",
            borderRadius: 50,
            paddingRight: 50,
            paddingLeft: 50,
          }}
        >
          <Text style={{
            height: "100%",
            fontSize: 25,
            textAlign: "center",
            textAlignVertical: "center",
            color: "black",
          }}>
            {`CONTINUE GAME!`}
          </Text>
        </Pressable>
      </View>
    </View>

    <Pressable
      onPress={() => actions.setMode("new")}
      title="yes"
      style={{
        height: 35,
        borderBottomColor: "white",
        backgroundColor: "transparent",
        borderRadius: 50,
        margin: 10,
        flex: 0,
      }}
    >
      <Text style={{
        height: "100%",
        textAlign: "center",
        textAlignVertical: "center",
        color: "black",
      }}>
        {`OPEN NEW GAME`}
      </Text>
    </Pressable>

  </View >)
}

export default OpenScreen;
