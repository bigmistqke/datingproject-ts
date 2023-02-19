import React, { useEffect, useRef, useState } from 'react';
import { Animated, Vibration, View } from 'react-native';

import { Show, useMount } from './utils/solid-like-components.js';
import { CardRenderer } from './card/CardRenderer';
import VideoRenderer from './card/VideoRenderer.js';
import { useStore } from '../store/Store.js';
import { Instruction } from '../../../types.js';

type CardProps = {
  instruction: Instruction;
  index: number;
  instruction_id: string;
};

const Card = (props: CardProps) => {
  const [state, actions] = useStore();
  const [flip, setFlip] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const random_angle = useRef(Math.random() * 15 + 3).current;
  const flip_value = useRef(new Animated.Value(1)).current;

  // Next, interpolate beginning and end values (in this case 0 and 1)
  const rotation = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const rotation_ = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${random_angle}deg`],
  });

  const reversed_rotation = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });
  const reversed_rotation_ = flip_value.interpolate({
    inputRange: [0, 1],
    outputRange: [`${random_angle * -1}deg`, '0deg'],
  });

  useEffect(() => {
    if (!flip) {
      flip_value.setValue(1);
      return;
    }

    actions.addToStats('play', props.instruction);
    Vibration.vibrate();

    Animated.spring(flip_value, {
      toValue: 0,
      stiffness: 75,
      mass: 1,
      damping: 15,
      useNativeDriver: true, // <-- Add this
    }).start(() => {});

    if (state.autoswipe && props.instruction.type !== 'video' && !props.instruction.timespan) {
      setTimeout(() => {
        actions.swipeAway(state.instruction_index);
        actions.swipe(props.instruction);
      }, 1500);
    }
  }, [actions, flip, flip_value, props.instruction, state.autoswipe, state.instruction_index]);

  useMount(() => {
    if (props.index < 3) {
      setInitialized(true);
    } else {
      setTimeout(() => setInitialized(true), 1000);
    }
  });

  useEffect(() => {
    if (props.instruction.prev_instruction_ids.length === 0) {
      setFlip(true);
    } else {
      setFlip(false);
    }
  }, [props.instruction.prev_instruction_ids]);

  const container_style = {
    position: 'absolute',
    backfaceVisibility: 'hidden',
  };

  const card_style = {
    position: 'relative',
    width: state.viewport.card_size.width,
    height: state.viewport.card_size.height,
    left: (state.viewport.window_size.width - state.viewport.card_size.width) / 2,
    top: (state.viewport.window_size.height - state.viewport.card_size.height) / 2,
    borderRadius: 35,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    elevation: 15,
  };

  return (
    <>
      <Show when={initialized}>
        <Animated.View
          style={[
            {
              transform: [{ rotateY: rotation }, { rotateZ: rotation_ }, { perspective: 5000 }],
            },
            container_style,
          ]}
        >
          <Show when={props.instruction.type !== 'video'}>
            <View style={card_style} renderToHardwareTextureAndroid>
              <CardRenderer
                modes={{
                  timed:
                    props.instruction.timespan && +props.instruction.timespan != 0 ? true : false,
                  choice:
                    props.instruction.text && props.instruction.text.length > 1 ? true : false,
                }}
                design_type={props.instruction.type}
                instruction={props.instruction}
                instruction_id={props.instruction.instruction_id}
                flip={flip}
              />
            </View>
          </Show>
          {props.instruction.type === 'video' ? (
            <View style={card_style}>
              <VideoRenderer {...props} flip={flip} />
            </View>
          ) : null}
        </Animated.View>
        <Animated.View
          style={[
            {
              transform: [
                { rotateY: reversed_rotation },
                { rotateZ: reversed_rotation_ },
                { perspective: 5000 },
              ],
            },
            container_style,
          ]}
        >
          <View style={card_style} renderToHardwareTextureAndroid={true}>
            <CardRenderer design_type="back" />
          </View>
        </Animated.View>
      </Show>
    </>
  );
};

export default Card;
