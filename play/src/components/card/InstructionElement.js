import React, { useEffect, useMemo } from 'react';
import { Show, For } from '../solid-like-components';
import { View, Text } from "react-native";

import { useStore } from '../../store/Store';

const InstructionElement = props => {
  const [, actions] = useStore();


  return (
    <>
      <View className="text-container">
        <For each={props.instruction.text}>
          {(instruction, index) => (
            instruction.content ?
              <View
                key={`${instruction.instruction_id}_${index}`}
              >
                <Show when={instruction.type === 'normal'}>
                  <Text
                    style={actions.getTextStyles({ element: props.element, masked: props.masked })}>
                    {instruction.content}
                  </Text>
                </Show>
                <Show when={instruction.type === 'choice'}>
                  <View style={{
                    display: "flex",

                    // backgroundColor: "grey",
                    justifyContent: "flex-end",
                    flexDirection: "row",
                    flexWrap: "wrap",
                  }}>
                    <For each={instruction.content}>
                      {(choice, index2) => (
                        <Text

                          key={`${instruction.instruction_id}_${index}_${index2}`}
                          style={actions.getHighlightStyles({ element: props.element, masked: props.masked })}>
                          {choice}
                        </Text>
                      )}
                    </For>
                  </View>
                </Show>
              </View> : null
          )}
        </For>
      </View>
    </>
  );
};

export default InstructionElement;
