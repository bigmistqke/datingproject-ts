import React, { useEffect } from 'react';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';
import Prompt from './components/Prompt';
import { Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';


import { useStore } from "./store/Store"
import { Show } from './components/solid-like-components';


function App() {
  const [state, actions] = useStore();

  useEffect(() => {
    console.log('hallo');
    actions.syncClock();
    actions.checkCachedGameId();
    actions.initNetInfo();
  }, []);

  return (
    <View
      style={{ backgroundColor: "lightgrey" }}
      onLayout={(event) => {
        let { width, height } = event.nativeEvent.layout;
        actions.setWindowSize({ width, height })
      }}>
      <Show when={!state.instructions && !state.viewport.loading_percentage}>
        <ScanScreen
          onRead={actions.initGame}
        />
      </Show>
      <Show when={!state.instructions && state.viewport.loading_percentage}>
        <Text>loaded: {state.viewport.loading_percentage}%</Text>
      </Show>
      <Show when={state.bools.isInitialized}>
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
