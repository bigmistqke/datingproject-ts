import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dimensions, View } from 'react-native';

import check from '../helpers/check.js';

import { useStore } from '../store/Store.js';
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Video from 'react-native-video';





const Swipe = (props) => {
  const [state, actions] = useStore();

  const [tweened_margin, setTweenedMargin] = useState(props.margin);
  const [can_swipe, setCanSwipe] = useState(false);

  const MARGIN_SIZE = 60;

  const DRAG_TRESHOLD = useRef(150).current;


  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const rotationZ = useSharedValue(0);
  const margin = useSharedValue((props.margin + 1) * MARGIN_SIZE);
  const screen = Dimensions.get("screen");

  const swipe = () => actions.swipe(props.instruction);

  useEffect(() => {
    translationX.value = 0;
    translationY.value = 0;
    rotationZ.value = 0;
  }, [props.margin])

  const swipeAway = (delta = 25) => {
    let angle;
    if (translationY.value === 0 && translationX.value === 0) {
      angle = Math.random() * Math.PI * 2;
    } else {
      angle = translationY.value === 0 && translationX.value === 0 ?
        Math.atan2(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI) :
        Math.atan2(translationY.value, translationX.value);
    }

    translationX.value = withTiming(Dimensions.get('screen').width * 3 * Math.cos(angle), { duration: 200 });
    translationY.value = withTiming(Dimensions.get('screen').height * 3 * Math.sin(angle), { duration: 200 });

    rotationZ.value = withTiming(0, { duration: 200 });
  }

  const PanGestureEvent = useAnimatedGestureHandler({
    onStart: (e, ctx) => {
      ctx.translationX = e.translationX;
      ctx.translationY = e.translationY;
    },
    onActive: (e, ctx) => {
      if (props.margin !== 0) return;
      translationX.value = e.translationX + ctx.translationX;
      translationY.value = e.translationY + ctx.translationY;
      rotationZ.value = translationX.value / screen.width * 25;
    },
    onEnd: (e) => {

      if (
        !can_swipe ||
        props.instruction.type === 'video' ||
        +props.instruction.timespan ||
        Math.sqrt(Math.pow(translationX.value, 2) + Math.pow(translationY.value, 2)) < DRAG_TRESHOLD
      ) {
        translationX.value = withSpring(0, { mass: 0.5 });
        translationY.value = withSpring(0, { mass: 0.5 });
        rotationZ.value = withSpring(0, { mass: 0.5 });
      } else {
        const angle = Math.atan2(translationY.value, translationX.value);
        translationX.value = withTiming(screen.width * 3 * Math.cos(angle), { duration: 125 });
        translationY.value = withTiming(screen.height * 3 * Math.sin(angle), { duration: 125 });
        runOnJS(swipe)();
      }
    }
  })

  useEffect(() => {
    if (!props.instruction.swiped) return;
    swipeAway(500);
  }, [props.instruction.swiped])


  useEffect(() => {
    setTweenedMargin(props.margin);
    setTimeout(() => {
      margin.value = withSpring(
        props.margin * MARGIN_SIZE,
        {
          mass: 1,
          damping: 15,
        }
      );
    }, props.margin * 200)
  }, [props.margin])

  useEffect(() => {
    console.log("timer", state.timers[props.instruction.instruction_id])
    if (!check(state.timers[props.instruction.instruction_id])) return;
    if (state.timers[props.instruction.instruction_id] !== 0) return
    swipeAway(500);
    swipe();
    if (props.instruction.sound) state.sound.play();
  }, [state.timers[props.instruction.instruction_id]])


  useEffect(() => {
    if (props.instruction.prev_instruction_ids.length === 0) {
      setCanSwipe(true)
    } else {
      setCanSwipe(false);
    }
  }, [props.instruction.prev_instruction_ids])

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { rotateZ: rotationZ.value + "deg" }
    ],
    left: margin.value,
    top: margin.value,
  }))

  return (
    <View>
      <PanGestureHandler onGestureEvent={PanGestureEvent}>
        <Animated.View
          style={[aStyle, {
            position: 'absolute',
            height: state.viewport.card_size.height,
            width: state.viewport.card_size.width,
            zIndex: 100 - props.margin,
            ...props.style
          }]}
          pointerEvents={'box-only'}
        >
          {props.children}
        </Animated.View>
      </PanGestureHandler>
      {/* <Video source={{ uri: }}></Video> */}
    </View >
  );
}



export default Swipe;