// import Draggable from '../viewport/Draggable';
// import {Show, useEffect, onMount, createSignal} from 'solid-js';
import styled from 'styled-components/native';
import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Show } from '../solid-like-components';

import SVGElement from './SVGElement';
import InstructionElement from './InstructionElement';
import CountdownElement from './CountdownElement';

// import ResizeHandles from '../viewport/ResizeHandles';

import { useStore } from '../../Store';

const CardElement = props => {
  const [state, { getCardSize, getPosition, getDimensions }] = useStore();


  const Element = styled.View`
    pointer-events: none;
    & > * {
      pointer-events: all;
    }
  `



  let position = useMemo(() => getPosition(props.element),
    [props.element])

  let dimensions = useMemo(() => getDimensions(props.element),
    [props.element])

  // useEffect(() => console.log("HALLO!!!", dimensions, position), [dimensions, position])

  return (
    <View
      position={{ ...position }}
      style={
        dimensions
          ? {
            width: dimensions.width,
            height: dimensions.height,
            position: 'absolute',
            left: position.x,
            top: position.y,
          }
          : null
      }>
      <Element>
        <Show when={props.type === 'instruction'}>
          {/* <Text>HALLO</Text> */}
          <InstructionElement {...props}></InstructionElement>
        </Show>
        <Show when={props.type === 'svg'}>
          <SVGElement {...props}></SVGElement>
        </Show>
        {/* <Show when={props.type === 'countdown'}>
          <CountdownElement {...props}></CountdownElement>
        </Show>
        
        */}
      </Element>
    </View>
  );
};

export default CardElement;
