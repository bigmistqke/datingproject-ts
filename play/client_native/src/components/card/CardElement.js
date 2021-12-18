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
  const [, actions] = useStore();


  const Element = styled.View`
    pointer-events: none;
    & > * {
      pointer-events: all;
    }
  `

  return (
    <View
      // position={props.element.position}
      style={{
        position: 'absolute',
        width: actions.getCardSize().width * props.element.dimensions.width / 100,
        height: actions.getCardSize().height * props.element.dimensions.height / 100,
        left: actions.getCardSize().width * props.element.position.x / 100,
        top: actions.getCardSize().height * props.element.position.y / 100,
      }}>
      <Element>
        <Show when={props.type === 'instruction'}>
          <InstructionElement {...props}></InstructionElement>
        </Show>
        <Show when={props.type === 'svg'}>
          <SVGElement {...props} />
        </Show>
      </Element>
    </View>
  );
};

export default CardElement;
