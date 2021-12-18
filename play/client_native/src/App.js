import React, { useEffect } from 'react';
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';
import Prompt from './components/Prompt';


import { useStore } from "./store/Store"
import { Show } from './components/solid-like-components';


function App() {
  const [{ previous_game_id }, actions] = useStore();

  useEffect(() => {
    actions.checkCachedGameId()
  }, []);

  return (
    <>
      <Show when={!actions.getInstructions()}>
        <ScanScreen onRead={actions.initGame}></ScanScreen>
      </Show>
      <Show when={actions.getInstructions()}>
        <GameScreen game_id={actions.getId("game")} instructions={actions.getInstructions()} />
      </Show>
      <Show when={actions.getPreviousGameId() && !actions.getInstructions()}>
        <Prompt
          text='open previous geme?'
          onSubmit={
            (result) => {
              if (result) {
                actions.initGame(actions.getPreviousGameId());
              }
            }
          }>
        </Prompt>
      </Show>
    </>
  );
}

export default App;
