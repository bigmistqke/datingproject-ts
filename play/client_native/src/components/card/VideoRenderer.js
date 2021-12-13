import Video from "react-native-video"
import React, { } from 'react';
import { StyleSheet } from 'react-native';

import { useStore } from "../../store/Store";

export default function VideoRenderer(props) {
  const [, actions] = useStore();

  const onVideoEnd = () => {
    console.info('video ended');
    actions.swipe(props.instruction);
  }
  return (
    <Video autoplay onEnd={onVideoEnd}
      style={{
        ...styles.video,
        borderRadius: parseInt(actions.getBorderRadius() * 10),
      }}
      source={{ uri: props.url }}>
    </Video>
  )
}

var styles = StyleSheet.create({
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
