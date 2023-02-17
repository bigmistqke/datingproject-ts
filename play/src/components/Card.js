import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useStore } from '../store/Store.js';
import { CardRenderer, BackRenderer } from './card/CardRenderer';
import VideoRenderer from './card/VideoRenderer.js';

import { onMount, Show } from './solid-like-components.jsx';
// import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { View, Animated, Vibration } from 'react-native';
const Card = React.memo((props) => {
  const [state, actions] = useStore();
  const [flip, setFlip] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const random_angle = useRef(Math.random() * 15 + 3).current;
  const flip_value = useRef(new Animated.Value(1)).current;

  // Next, interpolate beginning and end values (in this case 0 and 1)
  const rotation = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  })
  const rotation_ = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${random_angle}deg`]
  })

  const reversed_rotation = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  })
  const reversed_rotation_ = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: [`${random_angle * -1}deg`, '0deg']
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

    actions.addToStats("play", props.instruction);
    Vibration.vibrate();

    Animated.spring(flip_value, {
      toValue: 0,
      stiffness: 75,
      mass: 1,
      damping: 15,
      useNativeDriver: true // <-- Add this
    }).start(() => { })


    if (
      state.autoswipe &&
      props.instruction.type !== 'video' &&
      !props.instruction.timespan
    ) {
      setTimeout(() => {
        actions.swipeAway(state.instruction_index);
        actions.swipe(props.instruction)
      }, 1500)
    }
  }, [flip])

  onMount(() => {
    if (props.index < 3) {
      setInitialized(true)
    } else {
      setTimeout(
        () => setInitialized(true),
        1000)
    }
  })

  useEffect(() => {
    if (!instruction_state.current) return;
    if (props.instruction.prev_instruction_ids.length === 0) {
      setFlip(true);
    } else {
      setFlip(false);

    }
  }, [instruction_state.current, props.instruction.prev_instruction_ids])

  const container_style = {
    position: "absolute",
    backfaceVisibility: "hidden"
  }

  const card_style = {
    position: 'relative',
    width: state.viewport.card_size.width,
    height: state.viewport.card_size.height,
    left: ((state.viewport.window_size.width - state.viewport.card_size.width) / 2),
    top: ((state.viewport.window_size.height - state.viewport.card_size.height) / 2),
    borderRadius: 35,
    overflow: "hidden",
    backfaceVisibility: 'hidden',
    elevation: 15
  }


  return (<>
    <Show when={initialized}>
      <Animated.View
        style={[{
          transform: [
            { rotateY: rotation },
            { rotateZ: rotation_ },
            { perspective: 5000 },

          ],
        }, container_style]}
      >
        <Show when={props.instruction.type !== 'video'}>
          <View
            style={card_style}
            renderToHardwareTextureAndroid
          >
            <CardRenderer

              modes={{
                timed: props.instruction.timespan && +props.instruction.timespan != 0 ? true : false,
                choice: props.instruction.text && props.instruction.text.length > 1 ? true : false
              }}
              design_type={props.instruction.type}
              instruction={props.instruction}
              instruction_id={props.instruction.instruction_id}
              flip={flip}
            />

          </View>

        </Show>
        <Show when={props.instruction.type === 'video'}>
          <View
            style={card_style}
          >
            <VideoRenderer
              url={props.instruction.text}
              {...props}
            />
          </View>
        </Show>

      </Animated.View>
      <Animated.View
        style={[{
          transform: [
            { rotateY: reversed_rotation },
            { rotateZ: reversed_rotation_ },
            { perspective: 5000 }
          ]
        }, container_style]} >
        <View
          style={card_style}
          renderToHardwareTextureAndroid={true}
        >
          <CardRenderer design_type="back" instruction_id={props.instruction.instruction_id} />

        </View>
      </Animated.View>
    </Show>


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