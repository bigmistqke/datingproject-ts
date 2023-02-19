import React, { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { DesignElement, Instruction } from '../../../../types';

import { useStore } from '../../store/Store';
import check from '../../utils/check';

type CountdownElementProps = {
  instruction: Instruction;
  element: DesignElement;
  masked: DesignElement;
};

const CountdownElement = (props: CountdownElementProps) => {
  const [state, actions] = useStore();

  const text_styles = useCallback(
    () => actions.getTextStyles({ element: props.element, masked: props.masked }),
    [],
  );

  const formatted_time = useMemo(() => {
    if (!state.timers[props.instruction.instruction_id]) {
      return null;
    }
    const time = Math.floor(state.timers[props.instruction.instruction_id]);
    const min = Math.floor(time / 60);
    const sec = time - min * 60;
    if (min > 0) {
      return `${min}m${sec}s`;
    } else {
      return `${Math.max(0, sec)}s`;
    }
  }, []);

  return (
    <>
      <Text
        style={{
          ...text_styles,
          height: '100%',
          textAlignVertical: 'center',
          textAlign: 'center',
        }}
      >
        {check(state.timers[props.instruction.instruction_id])
          ? formatted_time
          : props.instruction.timespan}
      </Text>
    </>
  );
};

export default CountdownElement;
