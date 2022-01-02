import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Text } from "react-native";

import { useStore } from '../../store/Store';
import Tweener from '../../helpers/tweener';


const CountdownElement = props => {
  const [state, actions] = useStore();
  const [timer, setTimer] = useState();
  const tweener = useRef(new Tweener()).current;

  const text_styles = useMemo(() =>
    actions.getTextStyles({ element: props.element, masked: props.masked })
    , []
  );


  /*   useEffect(() => {
      tweener.tweenTo(0, 1, props.instruction.timespan * 1000,
        (alpha) => {
          setTimer(parseInt(props.instruction.timespan - alpha * props.instruction.timespan) + 1);
        }
      );
    }, []) */

  return (
    <>
      <Text /* className="text-container" */ style={{
        ...text_styles,
        height: "100%",
        textAlignVertical: "center",
        textAlign: "center",
      }}>

        {state.timers[props.instruction.instruction_id]}
      </Text>
    </>
  );
};

export default CountdownElement;
