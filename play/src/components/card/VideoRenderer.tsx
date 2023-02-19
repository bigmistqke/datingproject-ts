import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Video from 'react-native-video';

import { useStore } from '../../store/Store';

import { Show } from '../utils/solid-like-components';

import RNFS from 'react-native-fs';
import { Instruction, DesignElementText } from '../../../../types';

type VideoRendererProps = {
  instruction: Instruction;
  flip: boolean;
};

export default function VideoRenderer(props: VideoRendererProps) {
  const [state, actions] = useStore();

  const [uri, setUri] = useState<string>();
  const [loaded, setLoaded] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);

  const video_path = useMemo(() => {
    if (typeof props.instruction.text !== 'string') {
      return;
    }
    const base_url = RNFS.DocumentDirectoryPath + '/videos';
    const filename =
      props.instruction.text.split('/')[props.instruction.text.split('/').length - 1];
    return `${base_url}/${filename}`;
  }, []);

  const onVideoEnd = useCallback(() => {
    actions.swipeAway(state.instruction_index);
    actions.swipe(props.instruction);
  }, []);

  useEffect(() => {
    if (!props.flip) {
      setShouldPlay(false);
      return;
    }
    setTimeout(async () => {
      setShouldPlay(true);
    }, 250);
  }, [props.flip]);

  useEffect(() => {
    if (!video_path || uri) return;

    setTimeout(() => {
      setUri(video_path);
    }, 750);
  }, [video_path, uri]);

  return (
    <Show when={!!uri}>
      <Video
        paused={loaded && !shouldPlay}
        onEnd={onVideoEnd}
        playInBackground={true}
        onLoad={() => {
          setTimeout(() => {
            setLoaded(true);
          }, 10);
        }}
        resizeMode="cover"
        style={{
          height: '100%',
          position: 'relative',
          width: '100%',
          flex: 1,
          borderRadius: 35,
        }}
        source={{ uri: uri! }}
        onError={err => console.error('VIDEO ', err)}
      />
    </Show>
  );
}
