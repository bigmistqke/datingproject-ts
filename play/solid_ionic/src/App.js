import { onMount, Show } from "solid-js";
import ScanScreen from './screens/ScanScreen';
import GameScreen from './screens/GameScreen';
import LoadingScreen from './screens/LoadingScreen';
import Prompt from './components/Prompt';


import { useStore } from "./store/Store"


function App() {
  const [, actions] = useStore();

  onMount(() => {
    actions.checkCachedGameId()
  });

  return (
    <>
      <Show when={!actions.getInstructions()}>
        <ScanScreen onRead={actions.initGame}></ScanScreen>
      </Show>
      {/* <Show when={actions.getInstructions()}>
        <GameScreen game_id={actions.getId("game")} instructions={actions.getInstructions()} />
      </Show>
      <Show when={actions.getPreviousGameId() && !actions.getInstructions()}>
        <Prompt
          text='open previous game?'
          onSubmit={
            (result) => {
              if (result) {
                actions.initGame(actions.getPreviousGameId());
              }
            }
          }>
        </Prompt>
      </Show> */}
    </>
  );
}

export default App;
