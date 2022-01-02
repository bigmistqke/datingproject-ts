import React, { useEffect } from 'react';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';
import Prompt from './components/Prompt';
import { Text } from "react-native";

import { useStore } from "./store/Store"
import { Show } from './components/solid-like-components';


function App() {
  const [state, actions] = useStore();

  useEffect(() => {
    actions.checkCachedGameId()
  }, []);

  return (
    <>
      <Show when={!state.instructions && !state.viewport.loading_percentage}>
        <ScanScreen
          onRead={actions.initGame}
        />
      </Show>
      <Show when={state.viewport.loading_percentage}>
        <Text>loaded: {state.viewport.loading_percentage}%</Text>
      </Show>
      <Show when={state.instructions}>
        <GameScreen
          game_id={state.ids.game}
          instructions={state.instructions}
        />
      </Show>

    </>
  );
}

export default App;
