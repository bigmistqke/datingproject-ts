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

const CardRenderer = props => {
  return (
    < CardContainer >
      <CardCompositor
        {...props}
      />
    </CardContainer >
  )
}

const CardCompositor = props => {
  useEffect(() => {
    if (props.modes && props.modes.timed) {


    }
  })
  return (
    <>
      <CardElements {...props} masked={false}></CardElements>
      <Show when={props.modes && props.modes.timed}>
        <CardMask {...props}>
          <CardElements {...props} masked={true}></CardElements>
        </CardMask>
      </Show>
    </>
  )
}

const CardElements = props => {
  const [state, actions] = useStore();

  useEffect(() => {
    if (!state.design.types[props.design_type]) {
      console.log("state.design.types, props.design_type");
      console.log(Object.keys(state.design.types), props.design_type);
      console.log("hallo")
    }
  }, [])

  return (
    <Show
      renderToHardwareTextureAndroid={true}
      when={state.design.types[props.design_type]}
    >
      <For each={state.design.types[props.design_type]}>
        {(element, index) => (
          <Show key={element.id}
            when={!props.modes || actions.isElementVisible({ element, modes: props.modes })}>
            <CardElement
              index={index}
              element={element}
              type={element.type}
              {...props}>
            </CardElement>
          </Show>
        )}
      </For>
    </Show>
  )

};

export { CardRenderer, BackRenderer };

