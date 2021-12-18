import { For } from '../solid-like-components';
import React, { useMemo } from 'react';

import { useStore } from '../../store/Store';

const CountdownElement = props => {
  const [, { getTextStyles, getTimer }] = useStore();

  const text_styles = getTextStyles({ element: props.element, masked: props.masked });

  const getTextAlignFromAlignment = () => {
    switch (text_styles.alignmentHorizontal) {
      case 'flex-start':
        return 'left';
      case 'center':
        return 'center';
      case 'flex-end':
        return 'right';
    }
  };

  return (
    <>
      <div className="text-container" style={text_styles}>
        {getTimer()}
      </div>
    </>
  );
};

export default CountdownElement;
