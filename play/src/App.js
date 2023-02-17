import React, { useEffect, useRef, useState } from 'react';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import OpenScreen from './screens/OpenScreen';

import LoadingScreen from './screens/LoadingScreen';
import Prompt from './components/Prompt';
import { View } from "react-native";

import KeepAwake from 'react-native-keep-awake';

import { useStore } from "./store/Store"
import { Show } from './components/solid-like-components';
import SplashScreen from "react-native-splash-screen";


function App() {
  const [state, actions] = useStore();

  useEffect(() => SplashScreen.hide(), [])
  useEffect(() => {
    async function init() {
      actions.syncClock();
      actions.initNetInfo();

      if (state.instructions) {
        actions.setMode("play")
      } else if (await actions.checkCachedGameId()) {
        actions.setMode("open")
      } else {
        actions.setMode("new")
      }
    }
    init();
  }, []);

  return (
    <View
      style={{
        backgroundColor: "lightgrey",
        height: "100%",
        width: "100%"
      }}
      onLayout={(event) => {
        let { width, height } = event.nativeEvent.layout;
        actions.setWindowSize({ width, height })
      }}>
      <Show when={state.mode === 'open'}>
        <OpenScreen
          onRead={actions.initGame}
        />
      </Show>
      <Show when={state.mode === 'new'}>
        <ScanScreen
          onRead={actions.initGame}
        />
      </Show>
      <Show when={state.mode === 'load'}>
        <LoadingScreen />
      </Show>
      <Show when={state.mode === 'play'}>
        <GameScreen
          game_id={state.ids.game}
          instructions={state.instructions}
        />
      </Show>
      <KeepAwake />
    </View>
  );
}

export default App;
