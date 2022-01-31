import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
// import { Dimensions, Animated, Text, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import Video from 'react-native-video';
import Tweener from "../helpers/tweener.js";
import { useStore } from '../store/Store.js';
import { CardRenderer, BackRenderer } from './card/CardRenderer';
import VideoRenderer from './card/VideoRenderer.js';
// import { SvgXml } from 'react-native-svg';

import { Show } from './solid-like-components.jsx';
// import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { View, Animated, Vibration } from 'react-native';
const Card = React.memo((props) => {
  const [state, actions] = useStore();
  const [flip, setFlip] = useState(false);
  // const rotation = useSharedValue(180);

  const flip_value = useRef(new Animated.Value(1)).current;

  // Next, interpolate beginning and end values (in this case 0 and 1)
  const rotation = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })
  const rotation_ = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg']
  })

  const reversed_rotation = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  })
  const reversed_rotation_ = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg']
  })

  const instruction_state = useRef();

  useEffect(() => {
    let index = state.instructions.findIndex(v => v.instruction_id === props.instruction_id);
    instruction_state.current = state.instructions[index].prev_instruction_ids;
  }, [])

  useEffect(() => {
    if (!flip) {
      flip_value.setValue(1);
      return
    }
    // rotation.value = 0; //withTiming(0, { duration: 200 });
    Vibration.vibrate();

    Animated.spring(flip_value, {
      toValue: 0,
      // speed: 8,
      stiffness: 0.5,
      damping: 0.1,
      mass: 0.0025,
      useNativeDriver: true // <-- Add this
    }).start();

    // does this make sure that it rotates??
    // not really..
    // setTimeout(() => rotation.value = 0, 250)

    if (
      state.autoswipe &&
      // props.instruction.prev_instruction_ids.length === 0 &&
      props.instruction.type !== 'video' &&
      !props.instruction.timespan
    ) {
      setTimeout(() => {
        actions.swipeAway(state.instruction_index);
        actions.swipe(props.instruction)
        // setTimeout(() => actions.swipe(props.instruction), 250)
      }, 750)
    }
  }, [flip])


  /*   let can_swipe = useMemo(() => {
      if (!flip) return false;
      if (props.instruction.timespan && props.instruction.countdown !== 0) return false;
      return true;
    }, [props.instruction, flip]); */


  const card_style = {
    position: 'relative',
    width: state.viewport.card_size.width,
    height: state.viewport.card_size.height,
    left: ((state.viewport.window_size.width - state.viewport.card_size.width) / 2),
    top: ((state.viewport.window_size.height - state.viewport.card_size.height) / 2),
    borderRadius: 35,
    // zIndex: -1,
    overflow: "hidden",
    backfaceVisibility: 'hidden',
  }

  /* const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: rotation.value + "deg" },
    ]
  })) */

  /* const aStyleInverted = useAnimatedStyle(() => ({
    transform: [
      { rotateY: (rotation.value - 180) + "deg" },
    ]
  })) */

  useEffect(() => {
    if (props.instruction.type === 'video') {

    }
  }, [])

  useEffect(() => {
    if (!instruction_state.current) return;
    console.log(props.instruction.prev_instruction_ids);
    if (props.instruction.prev_instruction_ids.length === 0) {
      setFlip(true)
    } else {
      setFlip(false);
    }
  }, [instruction_state.current, props.instruction.prev_instruction_ids])

  const container_style = { position: "absolute", backfaceVisibility: "hidden" }


  return (<>

    <Animated.View style={[{
      transform: [
        { rotateY: rotation },
        { rotateZ: rotation_ },

        { perspective: 5000 }
      ]
    }, container_style]} >
      <View style={card_style}>
        {/* <Show when={props.index < 3}> */}
        <Show when={props.instruction.type !== 'video'}>
          <CardRenderer
            modes={{
              timed: props.instruction.timespan && +props.instruction.timespan != 0 ? true : false,
              choice: props.instruction.text && props.instruction.text.length > 1 ? true : false
            }}
            design_type={props.instruction.type}
            instruction={props.instruction}
            flip={flip}
          />
        </Show>
        <Show when={props.instruction.type === 'video'}>
          <VideoRenderer
            url={props.instruction.text}
            {...props}
          />
        </Show>
        {/* </Show> */}
      </View>

    </Animated.View>

    <Animated.View style={[{
      transform: [
        { rotateY: reversed_rotation },
        { rotateZ: reversed_rotation_ },

        { perspective: 5000 }
      ]
    }, container_style]} >
      <View style={card_style}>
        <CardRenderer design_type="back" car />

      </View>
    </Animated.View>
  </>
  );
}, (prev, next) => {
  try {
    return prev.flip === next.flip
  } catch (err) {
    return false;
  }

})



export default Card