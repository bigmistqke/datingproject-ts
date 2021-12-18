import styled from 'styled-components/native';
import { useStore } from '../../store/Store';
import React from 'react';

import { View } from 'react-native';

const CardMask = props => {
  const [state, actions] = useStore();

  const Mask = styled.View`
    position: absolute;
    width: 100%;
    top: 0px;
    left: 0px;
    flex: 1;
    overflow: hidden;
  `;

  return (
    <Mask
      style={{
        height: props.percentage * actions.getCardSize().height / 100,
        position: "absolute",
        // 'clip-path': `polygon(0%  ${props.percentage}%, 100%  ${props.percentage}%, 100% 100%, 0% 100%)`,
      }}>
      {props.children}
    </Mask>
  );
};

export default CardMask;
