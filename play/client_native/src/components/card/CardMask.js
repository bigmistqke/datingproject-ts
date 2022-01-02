import styled from 'styled-components/native';
import { useStore } from '../../store/Store';
import React, { useEffect, useRef } from 'react';

import { View, Animated } from 'react-native';
import Tweener from '../../helpers/tweener';

const CardMask = props => {
  const [state, actions] = useStore();
  const tweener = useRef(new Tweener()).current;

  const timer_ref = useRef(new Animated.Value(0)).current;

  const Mask = styled.View`
    position: absolute;
    width: 100%;
    top: 0px;
    left: 0px;
    flex: 1;
    overflow: hidden;
  `;
  useEffect(() => {
    // console.log('props.flip', props.flip)
    // if (!props.flip) return;

    setTimeout(() => {
      // actions.updateTimer(props.instruction.instruction_id, alpha)

      tweener.tweenTo(0, 1, props.instruction.timespan * 1000,
        (alpha) => {
          timer_ref.setValue(parseInt(
            alpha *
            state.viewport.card_size.height
          ))
          const new_timer = parseInt(props.instruction.timespan - alpha * props.instruction.timespan) + 1;
          if (new_timer === state.timers[props.instruction.instruction_id]) return;
          actions.updateTimer(props.instruction.instruction_id,
            parseInt(props.instruction.timespan - alpha * props.instruction.timespan) + 1
          )
        },
        () => {
          actions.updateTimer(props.instruction.instruction_id, 0)
        }
      );
    }, 500)
  }, [])

  return (
    <Animated.View
      style={{
        width: "100%",
        top: 0,
        left: 0,
        overflow: "hidden",
        flex: 1,
        height: timer_ref,
        position: "absolute",
      }}>
      {props.children}
    </Animated.View>
  );
};

export default CardMask;
