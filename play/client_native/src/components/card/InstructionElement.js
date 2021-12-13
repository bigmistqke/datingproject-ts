import React, { useEffect, useMemo } from 'react';
import { Show, For } from '../solid-like-components';
import { View, Text } from "react-native";

import { useStore } from '../../store/Store';

const InstructionElement = props => {
  const [, { getTextStyles, getHighlightStyles }] = useStore();

  const text_styles = useMemo(() =>
    getTextStyles({
      element: props.element,
      swatches: props.swatches,
    }),
    [props.element, props.swatches]
  )

  const highlight_styles = () =>
    getHighlightStyles({ element: props.element, swatches: props.swatches });



  return (
    <>
      <View className="text-container" style={text_styles}>
        <For each={props.formatted_text}>
          {(instruction, index) => (
            <View key={index}>
              <Show when={instruction.type === 'normal'}>
                <Text
                  style={text_styles}>
                  {instruction.content}
                </Text>
              </Show>
              <Show when={instruction.type === 'choice'}>
                <View
                  style={{
                    // 'textAlign': highlight_styles()['align-items'],
                    // width: '100%',
                  }}>
                  <For each={instruction.content}>
                    {(choice, index) => (
                      <View key={index} /* style={{ ...highlight_styles() }} */>
                        <Text
                          style={{
                            flex: 'none',
                          }}>
                          {choice}
                        </Text>
                      </View>
                    )}
                  </For>
                </View>
              </Show>
            </View>
          )}
        </For>
      </View>
    </>
  );
};

export default InstructionElement;
