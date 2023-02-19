import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { useStore } from '../../store/Store';

import CardElement from './CardElement';
import CardMask from './CardMask';

import { For, Show } from '../utils/solid-like-components';

import { Instruction } from '../../../../types';

export type CardRendererProps =
  | {
      modes: {
        timed: boolean;
        choice: boolean;
      };
      design_type: string;
      instruction: Instruction;
      instruction_id: string;
      flip: boolean;
    }
  | {
      design_type: 'back';
    };

const CardContainer = styled.View`
  position: relative;
  flex: 1;
  height: 100%;
  width: 100%;
  elevation: 10;
  z-index: 5;
`;

const BackRenderer = (props: CardRendererProps) => (
  <CardContainer>
    <CardElements {...props} design_type="back" />
  </CardContainer>
);

const CardRenderer = React.memo((props: CardRendererProps) => (
  <CardContainer>
    <CardCompositor {...props} />
  </CardContainer>
));

const CardCompositor = (props: CardRendererProps) => {
  return (
    <>
      <CardElements {...props} masked={false} />
      <Show when={props.modes && props.modes.timed}>
        <CardMask {...props}>
          <CardElements {...props} masked={true} />
        </CardMask>
      </Show>
    </>
  );
};

const CardElements = (props: CardRendererProps) => {
  const [state, actions] = useStore();

  return (
    <Show when={!!state.design?.types[props.design_type]}>
      <View>
        <For each={state.design!.types[props.design_type]}>
          {(element, index) => (
            <Show
              key={element.id}
              when={!props.modes || actions.isElementVisible({ element, modes: props.modes })}
            >
              <CardElement index={index} element={element} type={element.type} {...props} />
            </Show>
          )}
        </For>
      </View>
    </Show>
  );
};

export { CardRenderer, BackRenderer };
