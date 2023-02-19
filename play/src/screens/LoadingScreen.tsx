import React, { useEffect } from 'react';
import { View } from 'react-native';
import FullScreenAndroid from 'react-native-fullscreen-chz';
import Text from '../components/AppText';
import { Show } from '../components/utils/solid-like-components';
import { useStore } from '../store/Store';

export default function LoadingScreen() {
  const [state] = useStore();
  useEffect(() => {
    FullScreenAndroid.enable();
  }, []);

  return (
    <View>
      <View
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            zIndex: 1,
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 20,
          }}
        >
          <Show when={state.viewport.loading_error}>
            <Text>error while loading game:</Text>
            <Text>{state.viewport.loading_error}</Text>
          </Show>
          <Show when={!state.viewport.loading_error}>
            <Show when={!state.viewport.loading_percentage}>
              <Text
                style={{
                  fontSize: 30,
                }}
              >
                loading metadata
              </Text>
            </Show>
            <Show when={state.viewport.loading_percentage}>
              <Text
                style={{
                  fontSize: 30,
                  marginBottom: 10,
                }}
              >
                loading media
              </Text>
              <Text
                style={{
                  fontSize: 30,
                }}
              >
                {Math.floor(state.viewport.loading_percentage!)}%
              </Text>
            </Show>
          </Show>
        </View>
        <View
          style={{
            backgroundColor: 'white',
            justifyContent: 'center',
            width: '100%',
            height: state.viewport.loading_percentage
              ? `${state.viewport.loading_percentage}%`
              : null,
          }}
        />
      </View>
    </View>
  );
}
