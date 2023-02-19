import React from 'react';
import { Text, View } from 'react-native';
import { For, Show } from '../utils/solid-like-components';

import { useStore } from '../../store/Store';
import { DesignElementText, Instruction } from '../../../../types';

type InstructionElementProps = {
  instruction: Instruction;
  element: DesignElementText;
  masked: DesignElementText;
};

const InstructionElement = (props: InstructionElementProps) => {
  const [, actions] = useStore();

  if (props.instruction.type === 'video') {
    return;
  }

  return (
    <>
      <View>
        <For each={props.instruction.text}>
          {(instruction, index) => (
            <Show when={instruction.content.length > 0}>
              <View key={`${props.instruction.instruction_id}_${index}`}>
                <Show when={instruction.type === 'normal'}>
                  <Text
                    style={actions.getTextStyles({ element: props.element, masked: props.masked })}
                  >
                    {instruction.content}
                  </Text>
                </Show>
                <Show when={instruction.type === 'choice'}>
                  <View
                    style={{
                      display: 'flex',

                      // backgroundColor: "grey",
                      justifyContent: 'flex-end',
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                    }}
                  >
                    <For each={instruction.content as string[]}>
                      {(choice, index2) => (
                        <Text
                          key={`${props.instruction.instruction_id}_${index}_${index2}`}
                          style={actions.getHighlightStyles({
                            element: props.element,
                            masked: props.masked,
                          })}
                        >
                          {choice}
                        </Text>
                      )}
                    </For>
                  </View>
                </Show>
              </View>
            </Show>
          )}
        </For>
      </View>
    </>
  );
};

export default InstructionElement;
