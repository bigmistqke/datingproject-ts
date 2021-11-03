/* eslint-disable react/react-in-jsx-scope */
import QRCodeScanner from 'react-native-qrcode-scanner';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';

function ScanScreen({ onRead }) {
  const input_ref = useRef();
  const game_url_ref = useRef();

  const TextInput = styled.TextInput`
    position: relative;
    z-index:99;
    background:white;
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
  return (<>
    <QRCodeScanner onRead={e => onRead(e.data)} resizeMode="cover" cameraStyle={{ height: "100%" }} />
    <View>
      <TextInput
        ref={input_ref}
        onChangeText={game_url => game_url_ref.current = game_url}
        onSubmitEditing={() => onRead(game_url_ref.current)}
      ></TextInput>
    </View>
  </>)
}

export default ScanScreen;
