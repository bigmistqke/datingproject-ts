import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Text } from "react-native";

import { useStore } from '../../store/Store';
import check from '../../helpers/check';


const CountdownElement = props => {
  const [state, actions] = useStore();
  const [timer, setTimer] = useState();

  const text_styles = useMemo(() =>
    actions.getTextStyles({ element: props.element, masked: props.masked })
    , []
  );

  const formatted_time = useMemo(() => {
    if (!state.timers[props.instruction.instruction_id]) return null
    const time = parseInt(state.timers[props.instruction.instruction_id]);
    const min = parseInt(time / 60);
    const sec = time - min * 60;
    if (min > 0) {
      return `${min}m${sec}s`
    } else {
      return `${Math.max(0, sec)}s`
    }
  })

  return (
    <>
      <Text /* className="text-container" */ style={{
        ...text_styles,
        height: "100%",
        textAlignVertical: "center",
        textAlign: "center",
      }}>
        {
          check(state.timers[props.instruction.instruction_id]) ?
            formatted_time :
            props.instruction.timespan
        }
      </Text>
    </>
  );
};

export default CountdownElement;
