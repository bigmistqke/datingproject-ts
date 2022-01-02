// import Draggable from '../viewport/Draggable';
// import {Show, useEffect, onMount, createSignal} from 'solid-js';
import styled from 'styled-components/native';
import React, { useEffect, useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { Show } from '../solid-like-components';

import SVGElement from './SVGElement';
import InstructionElement from './InstructionElement';
import CountdownElement from './CountdownElement';

// import ResizeHandles from '../viewport/ResizeHandles';
import RNFS from "react-native-fs";


import { useStore } from '../../store/Store';

const CardElement = props => {
  const [state] = useStore();
  const Element = styled.View`
    pointer-events: none;
    
  `
  return (
    <View
      style={{
        position: 'absolute',
        width: state.viewport.card_size.width * props.element.dimensions.width / 100,
        height: state.viewport.card_size.height * props.element.dimensions.height / 100,
        left: state.viewport.card_size.width * props.element.position.x / 100,
        top: state.viewport.card_size.height * props.element.position.y / 100,
      }}>
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
