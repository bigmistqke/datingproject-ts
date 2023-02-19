import React from 'react';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';

import { Instruction, DesignElementText } from '../../../../types';
import { useStore } from '../../store/Store';

const base_url = RNFS.DocumentDirectoryPath + '/designs';

type InstructionElementProps = {
  instruction: Instruction;
  element: DesignElementText;
  masked: DesignElementText;
};

const SVGElement = (props: InstructionElementProps) => {
  const [state] = useStore();
  return (
    <FastImage
      style={{ width: '100%', height: '100%' }}
      source={{
        uri: `file://${base_url}/${props.element.id}_${props.masked ? 'masked' : 'normal'}.png?${
          state.game_start
        }`,
      }}
    />
  );
};
export default SVGElement;
