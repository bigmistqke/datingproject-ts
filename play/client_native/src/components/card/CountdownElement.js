import React, { useMemo, useRef, useEffect, useState } from 'react';
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
            state.timers[props.instruction.instruction_id] :
            props.instruction.timespan
        }
      </Text>
    </>
  );
};

export default CountdownElement;
