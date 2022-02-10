import Video from "react-native-video"
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStore } from "../../store/Store";
import { log, error } from "../../helpers/log";

import { Show } from "../solid-like-components"

import RNFS from "react-native-fs";

export default function VideoRenderer(props) {
  const [state, actions] = useStore();
  const [uri, setUri] = useState(null);

  const [shouldPlay, setShouldPlay] = useState(false);

  let dom = useRef();

  const onVideoEnd = () => {
    actions.swipeAway(state.instruction_index);
    actions.swipe(props.instruction);
    // setTimeout(() => actions.swipe(props.instruction), 250)
  }



  useEffect(() => {
    if (!props.flip) {
      setShouldPlay(false);
      return;
    }
    setTimeout(async () => {
      // await dom.current.seek(0);
      setShouldPlay(true);
    }, 250)
  }, [props.flip])

  useEffect(() => {
    if (!video_path || uri) return;
    console.log('uri is set');
    // I hope this will help in preventing flip-animation to freeze 
    // setTimeout(() => {
    setUri(video_path);
    // }, 750)
  }, [video_path, uri])

  let video_path = useMemo(() => {
    const base_url = RNFS.DocumentDirectoryPath + '/videos';
    let filename = props.instruction.text.split("/")[(props.instruction.text.split("/").length - 1)];
    return `${base_url}/${filename}`;
  }, [])

  useEffect(() => {
    console.log("VIDEO MOUNTEDD");
  }, [])

  return (
    // <Show when={uri}>
    <Video
      paused={!shouldPlay}
      onEnd={onVideoEnd}
      ref={dom}
      playInBackground={true}
      // onError={(err) => alert('video error: ', err)}
      resizeMode="cover"
      style={{
        height: "100%",
        position: "relative",
        width: "100%",
        flex: 1,
        borderRadius: 35,
      }}

      source={{ uri }}
    // onError={(err) => error("VIDEO ", err)}
    // onLoad={() => dom.current.seek(0)}
    />
    // </Show>

  )
}
