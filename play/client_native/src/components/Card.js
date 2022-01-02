import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { Dimensions, Animated, Text, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import Video from 'react-native-video';
import Tweener from "../helpers/tweener.js";
import { useStore } from '../store/Store.js';
import { CardRenderer, BackRenderer } from './card/CardRenderer';
import VideoRenderer from './card/VideoRenderer.js';
// import { SvgXml } from 'react-native-svg';

import { Show } from './solid-like-components.jsx';

import Swipe from './Swipe.js';

const Card = React.memo((props) => {

  const [state, actions] = useStore();

  useEffect(() => console.log("re-render", props.instruction.instruction_id));


  const tweener = useRef(new Tweener()).current;
  const timer_ref = useRef(new Animated.Value(0)).current;
  const rotation_ref = useRef(new Animated.Value(1)).current;
  const rotation = rotation_ref.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })
  const inversed_rotation = rotation_ref.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  })

  useEffect(() => {
    if (!props.flip) return;
    tweener.tweenTo(1, 0, 125,
      (alpha) => rotation_ref.setValue(alpha)
    );
  }, [props.flip])

  useEffect(() => {
    /* if (props.flip && props.timespan && !countdown_interval.current) {
      let start = performance.now();
      countdown_interval.current = setInterval(() => {
        let delta = (performance.now() - start) / 1000;
        const c = props.timespan - delta;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(timer_ref.current);
          // actions.swipe(props.instruction)
          props.onSwipe(props.instruction);
        }
      }, 1000 / 30)
    } */
  }, [props.flip, props.timespan]);


  let can_swipe = useMemo(() => {
    if (!props.flip) return false;
    if (props.instruction.timespan && props.instruction.countdown !== 0) return false;
    return true;
  }, [props.instruction]);


  const card_style = {
    position: 'absolute',
    width: state.viewport.card_size.width,
    height: state.viewport.card_size.height,
    left: ((state.viewport.window_size.width - state.viewport.card_size.width) / 2),
    top: ((state.viewport.window_size.height - state.viewport.card_size.height) / 2),
    borderRadius: 0.05 * state.viewport.card_size.height,
    elevation: 5,
    backfaceVisibility: 'hidden',
  }



  return (<>

    <Show when={props.flip}>
      <Animated.View
        style={{
          ...card_style,
          transform: [
            { rotateY: rotation },
          ]
        }}
      >
        <Show when={props.instruction.type !== 'video'}>
          <CardRenderer
            modes={{
              timed: props.instruction.timespan,
              choice: props.text && props.text.length > 0
            }}
            design_type={props.instruction.type}
            instruction={props.instruction}
          />
        </Show>
        <Show when={props.instruction.type === 'video'}>
          <VideoRenderer
            url={props.instruction.url}
            {...props}
          />
        </Show>
      </Animated.View>
    </Show>

    <Animated.View
      style={{
        ...card_style,
        transform: [{ rotateY: inversed_rotation }]
      }}
    >
      <CardRenderer design_type="back" />
    </Animated.View>
  </>
  );
}, (prev, next) => {
  try {
    return prev.flip === next.flip
  } catch (err) {
    console.error(err);
    return false;
  }

})



export default Card