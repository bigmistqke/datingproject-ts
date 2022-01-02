import Video from "react-native-video"
import React, { } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useStore } from "../../store/Store";

export default function VideoRenderer(props) {
  const [state, actions] = useStore();

  const onVideoEnd = () => {
    console.info('video ended');
    actions.swipeAway(props.index + state.instruction_index);
    setTimeout(() => {
      actions.swipe(props.instruction);
    }, 250)
  }
  return (
    <>
      <Video
        autoplay
        onEnd={onVideoEnd}
        style={{
          // backgroundColor: "yellow",
          overflow: "hidden",
          height: "100%",
          position: "absolute",
          width: "100%",
          // width: 50,
          // ...styles.video,
          flex: 1,
          borderRadius: 0.05 * state.viewport.card_size.height,
        }}
        source={{ uri: props.url }}
        onError={(err) => console.error("VIDEO ", err)}
        onLoad={() => console.log('video loaded')}
      >
      </Video>

    </>

  )
}

var styles = StyleSheet.create({
  video: {
    // backgroundColor: "red",
    position: 'absolute',
    height: "100%",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
