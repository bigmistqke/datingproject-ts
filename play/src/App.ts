import { useEffect } from 'react';

import { View } from 'react-native';

import KeepAwake from 'react-native-keep-awake';

import SplashScreen from 'react-native-splash-screen';
import { Show } from './components/utils/solid-like-components';
import { useStore } from './store/Store';

function App() {
  const [state, actions] = useStore();

  useEffect(() => SplashScreen.hide(), []);
  useEffect(() => {
    async function init() {
      actions.syncClock();
      actions.initNetInfo();

      if (state.instructions) {
        actions.setMode('play');
      } else if (await actions.checkCachedGameId()) {
        actions.setMode('open');
      } else {
        actions.setMode('new');
      }
    }
    init();
  }, []);

  return (
    <View
      style={{
        backgroundColor: 'lightgrey',
        height: '100%',
        width: '100%',
      }}
      onLayout={event => {
        let { width, height } = event.nativeEvent.layout;
        actions.setWindowSize({ width, height });
      }}
    >
      <Show when={state.mode === 'open'}>
        <OpenScreen onRead={actions.initGame} />
      </Show>
      <Show when={state.mode === 'new'}>
        <ScanScreen onRead={actions.initGame} />
      </Show>
      <Show when={state.mode === 'load'}>
        <LoadingScreen />
      </Show>
      <Show when={state.mode === 'play'}>
        <GameScreen game_id={state.ids.game} instructions={state.instructions} />
      </Show>
      <KeepAwake />
    </View>
  );
}

export default App;
