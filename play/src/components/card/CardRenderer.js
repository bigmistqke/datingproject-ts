import {useStore} from '../../store/Store';
import React, {useState, useEffect, useMemo} from 'react';
import {View} from 'react-native';
import styled from 'styled-components/native';

import CardElement from './CardElement';
import CardMask from './CardMask';

import {Show, For} from '../solid-like-components';

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
    <CardElements design_type="back" {...props} />
  </CardContainer>
);

const CardRenderer = React.memo(props => (
  <CardContainer>
    <CardCompositor {...props} />
  </CardContainer>
));
// }, (prev, next) => !prev.instruction.timespan)

const CardCompositor = props => {
  return (
    <>
      <CardElements {...props} masked={false}></CardElements>
      <Show when={props.modes && props.modes.timed}>
        <CardMask {...props}>
          <CardElements {...props} masked={true}></CardElements>
        </CardMask>
      </Show>
    </>
  );
};

const CardElements = props => {
  const [state, actions] = useStore();

  useEffect(() => {
    if (!state.design.types[props.design_type]) {
    }
  }, []);

  return (
    <Show when={state.design.types[props.design_type]}>
      <View
      // renderToHardwareTextureAndroid={true}
      >
        <For each={state.design.types[props.design_type]}>
          {(element, index) => (
            <Show
              key={element.id}
              when={
                !props.modes ||
                actions.isElementVisible({element, modes: props.modes})
              }>
              <CardElement
                index={index}
                element={element}
                type={element.type}
                {...props}></CardElement>
            </Show>
          )}
        </For>
      </View>
    </Show>
  );
};

export {CardRenderer, BackRenderer};
