
import { View } from 'react-native';
import React, { useEffect, progress } from 'react';
import Text from "../components/AppText"
import { useStore } from '../store/Store';
import { Show } from '../components/solid-like-components';
import FullScreenAndroid from 'react-native-fullscreen-chz';


export default function LoadingScreen({ loading_message }) {
  const [state, actions] = useStore();
  useEffect(() => {
    FullScreenAndroid.enable()
  }, [])

  return (
    <View>
      <View
        style={{
          width: "100%",
          height: "100%",
          overflow: 'hidden',
        }}
      >
        <View style={{
          position: "absolute",
          zIndex: 1,
          height: "100%",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 20
        }}>
          <Show when={state.viewport.loading_error}>
            <Text>error while loading game:</Text>
            <Text>{state.viewport.loading_error}</Text>
          </Show>
          <Show when={!state.viewport.loading_error}>
            <Show when={!state.viewport.loading_percentage}>
              <Text style={{
                fontSize: 30
              }}>
                loading metadata
              </Text>
            </Show>
            <Show when={state.viewport.loading_percentage}>
              <Text style={{
                fontSize: 30,
                marginBottom: 10,
              }}>loading media</Text>
              <Text style={{
                fontSize: 30
              }}>
                {parseInt(state.viewport.loading_percentage)}%
              </Text>
            </Show>
          </Show>

        </View>
        <View style={{
          backgroundColor: "white",
          justifyContent: "center",
          width: "100%",
          height: state.viewport.loading_percentage ? `${state.viewport.loading_percentage}%` : null
        }} />



      </View>
    </View>

  );
}
