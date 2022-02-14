import styled from 'styled-components/native';
import { useStore } from '../../store/Store';
import React, { useEffect, useRef, useState } from 'react';
import Animated, { Easing, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

const CardMask = props => {
  const [state, actions] = useStore();
  const mask_percentage = useSharedValue(0);
  useEffect(() => {
    if (!props.flip) return;
    setTimeout(() => {
      actions.startTimer(props.instruction.instruction_id, props.instruction.timespan);

      mask_percentage.value = withTiming(100,
        {
          duration: props.instruction.timespan * 1000 - 500,
          easing: Easing.linear
        });
    }, 300)
  }, [props.flip])

  let astyle = useAnimatedStyle(() => {
    return {
      height: mask_percentage.value + "%",
    }
  })

  return (
    <Animated.View
      style={[{
        width: "100%",
        top: 0,
        left: 0,
        overflow: "hidden",
        flex: 1,
        position: "absolute",
      }, astyle]}>
      {props.children}
    </Animated.View>
  );
};

export default CardMask;
