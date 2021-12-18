import CardElement from './CardElement';
import CardMask from './CardMask';

import React, { useState, useEffect, useMemo } from 'react';
import { Show, For } from '../solid-like-components';
import { useStore } from '../../store/Store';
import { View } from 'react-native';

const CardComposition = props => {
  const [, actions] = useStore();

  let elements = useMemo(() => actions.getElementsOfType(props.instruction.type))

  useEffect(() => console.log("random re-render check", props.instruction.instruction_id, props.instruction.type), [props.instruction])

  return (
    <For each={elements}>
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

const CardCompositor = React.memo(props => {
  return (
    <>
      <CardComposition {...props} masked={false}></CardComposition>
      <Show when={props.modes.timed}>
        <CardMask percentage={50}>
          <CardComposition {...props} masked={true}></CardComposition>
        </CardMask>
      </Show>
    </>
  );
});

export default CardCompositor;
