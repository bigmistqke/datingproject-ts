/* eslint-disable react/react-in-jsx-scope */
import QRCodeScanner from 'react-native-qrcode-scanner';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { Keyboard, Pressable, Text, Button } from 'react-native';
import { Show } from '../components/solid-like-components';

import { useStore } from "../store/Store"

function ScanScreen({ onRead }) {
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
    display: 'flex',
  }}>

    <Show when={state.previous_game_id && !state.instructions}>
      <View
        style={{
          flexDirection: 'row',
        }}>
        <Pressable
          onPress={() => actions.initGame(state.previous_game_id)}
          title="yes"
          style={{
            height: 35,
            borderBottomColor: "white",
            backgroundColor: "white",
            borderRadius: 50,
            margin: 10,
            flex: 1,
          }}
        >
          <Text style={{
            height: "100%",
            textAlign: "center",
            textAlignVertical: "center",
            color: "black",
          }}>
            {`open ${state.previous_game_id}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => actions.initGame(state.previous_game_id, true)}
          title="yes"
          style={{
            height: 35,
            borderBottomColor: "white",
            backgroundColor: "white",
            borderRadius: 50,
            margin: 10,
            flex: 1,
          }}
        >
          <Text style={{
            height: "100%",
            textAlign: "center",
            textAlignVertical: "center",
            color: "black",
          }}>
            {`force ${state.previous_game_id}`}
          </Text>
        </Pressable>
      </View>

    </Show>
    <View
      style={{
        flex: 1,
        overflow: "hidden",
        borderRadius: 25,
        margin: 5,
      }}
    >
      <QRCodeScanner
        onRead={e => onRead(e.data)}
        resizeMode="cover"

        cameraStyle={{
          transform: [{ scale: 1.2 }],
          width: "100%",
          height: "100%",
          borderRadius: 150,
        }}
      />
    </View>

    <View>
      <TextInput
        ref={input_ref}
        onChangeText={game_url => game_url_ref.current = game_url}
        onSubmitEditing={() => onRead(game_url_ref.current)}
        placeholder="enter game-id"
        style={{
          paddingLeft: 20,
          color: "black",
          borderRadius: 50,
          overflow: "hidden"
        }}
      ></TextInput>
    </View>
  </View>)
}

export default ScanScreen;
