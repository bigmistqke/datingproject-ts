import { useStore } from '../../store/Store';
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components/native';

import CardElement from './CardElement';
import CardMask from './CardMask';

import { Show, For } from '../solid-like-components';

const CardContainer = styled.View`
    position: relative; 
    flex: 1;
    height: 100%;
    width: 100%;
    background-color: transparent;
    elevation: 10;
    z-index: 5;
`;

const BackRenderer = props => (
  <CardContainer>
    <CardElements
      design_type="back"
      {...props}
    />
  </CardContainer>
)

const CardRenderer = props => (
  <CardContainer>
    <CardCompositor
      {...props}
    />
  </CardContainer>
)

const CardCompositor = props => (
  <>
    <CardElements {...props} masked={false}></CardElements>
    <Show when={props.modes && props.modes.timed}>
      <CardMask {...props}>
        <CardElements {...props} masked={true}></CardElements>
      </CardMask>
    </Show>
  </>
)

const CardElements = props => {
  const [state, actions] = useStore();
  return (
    <For each={state.design.types[props.design_type]}>
      {(element, index) => (
        <Show key={element.id}
          when={actions.isElementVisible({ element, modes: props.modes })}>
          <CardElement
            index={index}
            element={element}
            type={element.type}
            {...props}>
          </CardElement>
        </Show>
      )}
    </For>
  );
};

export { CardRenderer, BackRenderer };

