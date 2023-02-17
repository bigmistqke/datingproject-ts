import Video from "react-native-video"
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

import { useStore } from "../../store/Store";
import { log, error } from "../../helpers/log";

import { Show } from "../solid-like-components"

import RNFS from "react-native-fs";

import FastImage from "react-native-fast-image"


export default function VideoRenderer(props) {
  const [state, actions] = useStore();
  const [uri, setUri] = useState(null);
  const [loaded, setLoaded] = useState(false);

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
    setTimeout(() => {
      setUri(video_path);
    }, 750)
  }, [video_path, uri])

  let video_path = useMemo(() => {
    const base_url = RNFS.DocumentDirectoryPath + '/videos';
    let filename = props.instruction.text.split("/")[(props.instruction.text.split("/").length - 1)];
    return `${base_url}/${filename}`;
  }, [])

  let poster_path = useMemo(() =>
    video_path.replace(video_path.split(".").pop(), "jpg")
    , [video_path])


  return (
    <Show when={uri}>
      <Video
        paused={loaded && !shouldPlay}
        // paused={true}
        onEnd={onVideoEnd}
        ref={dom}
        playInBackground={true}
        onLoad={() => {
          console.log('loaded video');
          setTimeout(() => {
            setLoaded(true);
          }, 10)
        }}

        resizeMode="cover"
        style={{
          height: "100%",
          position: "relative",
          width: "100%",
          flex: 1,
          borderRadius: 35,
        }}

        source={{ uri }}
        onError={(err) => console.error("VIDEO ", err)}
      // onLoad={() => dom.current.seek(0)}
      />
    </Show>

  )
}
