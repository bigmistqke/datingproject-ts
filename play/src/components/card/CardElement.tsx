import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { Show } from '../utils/solid-like-components';

import CountdownElement from './CountdownElement';
import InstructionElement from './InstructionElement';
import SVGElement from './SVGElement';

import { useStore } from '../../store/Store';
import { DesignElement } from '../../../../types';

const CardElement = (props: {
  element: DesignElement;
  type: 'instruction' | 'countdown' | 'svg';
  index: number;
}) => {
  const [state] = useStore();
  const Element = styled.View`
    pointer-events: none;
  `;
  return (
    <View
      style={{
        position: 'absolute',
        width: (state.viewport.card_size.width * props.element.dimensions.width) / 100,
        height: (state.viewport.card_size.height * props.element.dimensions.height) / 100,
        left: (state.viewport.card_size.width * props.element.position.x) / 100,
        top: (state.viewport.card_size.height * props.element.position.y) / 100,
      }}
    >
      <Element>
        <Show when={props.type === 'instruction'}>
          <InstructionElement {...props}></InstructionElement>
        </Show>
        <Show when={props.type === 'svg'}>
          <SVGElement {...props} />
        </Show>
        <Show when={props.type === 'countdown'}>
          <CountdownElement {...props} />
        </Show>
      </Element>
    </View>
  );
};

export default CardElement;
