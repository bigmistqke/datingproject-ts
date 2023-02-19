import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useStore } from '../store/Store.js';
import { Instruction } from '../../../types.js';

import check from '../utils/check.js';

type SwipeProps = {
  margin: number;
  instruction: Instruction;
  children: JSX.Element | JSX.Element[];
};

const Swipe = (props: SwipeProps) => {
  const [state, actions] = useStore();
  const [can_swipe, setCanSwipe] = useState(false);

  const MARGIN_SIZE = 60;
  const DRAG_TRESHOLD = useRef(150).current;

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const rotationZ = useSharedValue(0);
  const margin = useSharedValue((props.margin + 1) * MARGIN_SIZE);

  const screen = Dimensions.get('screen');

  const swipe = useCallback(() => actions.swipe(props.instruction), [actions, props.instruction]);

  useEffect(() => {
    translationX.value = 0;
    translationY.value = 0;
    rotationZ.value = 0;
  }, [props.margin, rotationZ, translationX, translationY]);

  const swipeAway = useCallback(() => {
    let angle;
    if (translationY.value === 0 && translationX.value === 0) {
      angle = Math.random() * Math.PI * 2;
    } else {
      angle =
        translationY.value === 0 && translationX.value === 0
          ? Math.atan2(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI)
          : Math.atan2(translationY.value, translationX.value);
    }

    translationX.value = withTiming(Dimensions.get('screen').width * 3 * Math.cos(angle), {
      duration: 200,
    });
    translationY.value = withTiming(Dimensions.get('screen').height * 3 * Math.sin(angle), {
      duration: 200,
    });

    rotationZ.value = withTiming(0, { duration: 200 });
  }, [rotationZ, translationX, translationY]);

  const PanGestureEvent = useAnimatedGestureHandler({
    onStart: (e, ctx: { translationX: number; translationY: number }) => {
      ctx.translationX = e.translationX;
      ctx.translationY = e.translationY;
    },
    onActive: (e, ctx) => {
      if (props.margin !== 0) {
        return;
      }
      translationX.value = e.translationX + ctx.translationX;
      translationY.value = e.translationY + ctx.translationY;
      rotationZ.value = (translationX.value / screen.width) * 25;
    },
    onEnd: () => {
      if (
        !can_swipe ||
        props.instruction.type === 'video' ||
        typeof props.instruction.timespan === 'number' ||
        Math.sqrt(Math.pow(translationX.value, 2) + Math.pow(translationY.value, 2)) < DRAG_TRESHOLD
      ) {
        translationX.value = withSpring(0, { mass: 0.5 });
        translationY.value = withSpring(0, { mass: 0.5 });
        rotationZ.value = withSpring(0, { mass: 0.5 });
      } else {
        const angle = Math.atan2(translationY.value, translationX.value);
        translationX.value = withTiming(screen.width * 3 * Math.cos(angle), {
          duration: 125,
        });
        translationY.value = withTiming(screen.height * 3 * Math.sin(angle), {
          duration: 125,
        });
        runOnJS(swipe)();
      }
    },
  });

  useEffect(() => {
    if (!props.instruction.swiped) {
      return;
    }
    props.instruction.swiped;
    swipeAway();
  }, [swipeAway, props.instruction.swiped]);

  useEffect(() => {
    setTimeout(() => {
      margin.value = withSpring(props.margin * MARGIN_SIZE, {
        mass: 1,
        damping: 15,
      });
    }, props.margin * 200);
  }, [margin, props.margin]);

  useEffect(() => {
    if (!check(state.timers[props.instruction.instruction_id])) {
      return;
    }
    if (state.timers[props.instruction.instruction_id] !== 0) {
      return;
    }
    swipeAway();
    swipe();
    if (props.instruction.sound) {
      state.sound.play();
    }
  }, [
    props.instruction.instruction_id,
    props.instruction.sound,
    state.sound,
    state.timers,
    swipe,
    swipeAway,
  ]);

  useEffect(() => {
    if (props.instruction.prev_instruction_ids.length === 0) {
      setCanSwipe(true);
    } else {
      setCanSwipe(false);
    }
  }, [props.instruction.prev_instruction_ids]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { rotateZ: rotationZ.value + 'deg' },
    ],
    left: margin.value,
    top: margin.value,
  }));

  return (
    <View>
      <PanGestureHandler onGestureEvent={PanGestureEvent}>
        <Animated.View
          style={[
            aStyle,
            {
              position: 'absolute',
              height: state.viewport.card_size.height,
              width: state.viewport.card_size.width,
              zIndex: 100 - props.margin,
              ...props.style,
            },
          ]}
          pointerEvents={'box-only'}
        >
          {props.children}
        </Animated.View>
      </PanGestureHandler>
      {/* <Video source={{ uri: }}></Video> */}
    </View>
  );
};

export default Swipe;
