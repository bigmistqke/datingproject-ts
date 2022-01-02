import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Dimensions, StatusBar, Animated, PanResponder, View } from 'react-native';
import styled from 'styled-components/native';
import Tweener from "../helpers/tweener.js";
import check from '../helpers/check.js';

import { useStore } from '../store/Store.js';

const Swipe = (props) => {
  const [state] = useStore();

  const [tweened_margin, setTweenedMargin] = useState(props.margin);

  const MARGIN_SIZE = 12;

  const tweener = useRef(new Tweener()).current;
  const DRAG_TRESHOLD = useRef(200).current;
  const pan_ref = useRef(new Animated.ValueXY()).current;
  const translate_ref = useRef(new Animated.ValueXY()).current;
  const margin_ref = useRef(new Animated.Value(props.margin * MARGIN_SIZE)).current;

  let translate_start_ref = useRef().current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const rotateZ_ref = rotateZ.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1deg']
  })

  const translationToRotation = (x) => rotateZ.setValue(x / Dimensions.get('screen').width * 25);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      translate_start_ref = {
        x: translate_ref.x._value,
        y: translate_ref.y._value
      }
      pan_ref.setOffset({
        x: pan_ref.x._value,
        y: pan_ref.y._value
      });
    },
    onPanResponderMove: Animated.event([
      null, { dx: pan_ref.x, dy: pan_ref.y }
    ], {
      useNativeDriver: false,
      listener: (event, gestureState) => {
        translate_ref.setValue({
          x: translate_start_ref.x + pan_ref.x._value,
          y: translate_start_ref.y + pan_ref.y._value
        });
        translationToRotation(translate_ref.x._value);
      }
    }),
    onPanResponderRelease: () => {
      pan_ref.flattenOffset();
      if (
        Math.sqrt(
          Math.pow(translate_ref.x._value, 2) + Math.pow(translate_ref.y._value, 2)
        ) < DRAG_TRESHOLD ||
        props.instruction.timespan
      ) {
        snapBack();
      } else {
        swipeAway();
        setTimeout(props.onSwipe, 0)
      }
    }
  })).current;

  const swipeAway = /* useCallback( */(delta = 25) => {
    translate_start_ref = {
      x: translate_ref.x._value,
      y: translate_ref.y._value
    }
    const angle = Math.atan2(translate_start_ref.y, translate_start_ref.x)
    const new_dist = {
      x: Dimensions.get('screen').width * 3 * Math.cos(angle),
      y: Dimensions.get('screen').height * 2 * Math.sin(angle)
    }
    tweener.tweenTo(0, 1, delta,
      (alpha) => {
        translate_ref.setValue({
          x: translate_start_ref.x * (1 - alpha) + (new_dist.x) * alpha,
          y: translate_start_ref.y * (1 - alpha) + (new_dist.y) * alpha,
        })
        translationToRotation(translate_ref.x._value);
      }
    )
  }/* , []) */

  const snapBack = useCallback(() => {
    translate_start_ref = {
      x: translate_ref.x._value,
      y: translate_ref.y._value
    }
    tweener.tweenTo(1, 0, 250,
      (alpha) => {
        // console.log("SNAPBACK!!!");
        translate_ref.setValue({
          x: translate_start_ref.x * alpha,
          y: translate_start_ref.y * alpha
        });
        translationToRotation(translate_ref.x._value);
      }
    );
  }, [])



  useEffect(() => {
    if (!props.instruction.swiped) return;
    console.log("SWIPE AWAY!!");
    swipeAway(500);
  }, [props.instruction.swiped])


  useEffect(() => {

    if (tweened_margin !== props.margin) {
      setTimeout(() => {
        const margin_start = props.margin * MARGIN_SIZE;
        setTweenedMargin(props.margin);
        tweener.tweenTo(1, 0, 125,
          (alpha) => {
            margin_ref.setValue(margin_start + MARGIN_SIZE * alpha);
          }
        );
      }, props.margin * 100)

    }
  }, [props.margin])

  useEffect(() => {
    if (!check(state.timers[props.instruction.instruction_id])) return;
    if (state.timers[props.instruction.instruction_id] === 0) {
      swipeAway(500);
      setTimeout(props.onSwipe, 125)
    }
  }, [state.timers[props.instruction.instruction_id]])

  return (
    <View>
      <Animated.View
        style={{
          left: margin_ref,
          top: margin_ref,
          position: 'absolute',
          elevation: 10,
          height: state.viewport.card_size.height,
          width: state.viewport.card_size.width,
          elevation: 5,
          transform: [
            { translateX: translate_ref.x },
            { translateY: translate_ref.y },
            { rotateZ: rotateZ_ref },
          ],
          ...props.style
        }}
        {...panResponder.panHandlers}
        pointerEvents={props.pointerEvents}
      >
        {props.children}

      </Animated.View>
    </View >
  );
}



export default Swipe;