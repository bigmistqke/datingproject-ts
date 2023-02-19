import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Instruction } from '../../../../types';
import { useStore } from '../../store/Store';

const CardMask = (props: { instruction: Instruction; flip: boolean; children: JSX.Element }) => {
  const [, actions] = useStore();

  const mask_percentage = useSharedValue(0);
  useEffect(() => {
    if (!props.flip) {
      return;
    }
    setTimeout(() => {
      if (!props.instruction.timespan) {
        return;
      }
      actions.startTimer(props.instruction.instruction_id, props.instruction.timespan);

      mask_percentage.value = withTiming(100, {
        duration: props.instruction.timespan * 1000 - 500,
        easing: Easing.linear,
      });
    }, 300);
  }, [
    actions,
    mask_percentage,
    props.flip,
    props.instruction.instruction_id,
    props.instruction.timespan,
  ]);

  let astyle = useAnimatedStyle(() => ({
    height: mask_percentage.value + '%',
  }));

  return (
    <Animated.View
      style={[
        {
          width: '100%',
          top: 0,
          left: 0,
          overflow: 'hidden',
          flex: 1,
          position: 'absolute',
        },
        astyle,
      ]}
    >
      {props.children}
    </Animated.View>
  );
};

export default CardMask;
