import React from 'react';
import { TextInput, TextStyle } from 'react-native';

type AppTextInputProps = Omit<React.ComponentProps<typeof TextInput>, 'style'> & {
  style: TextStyle;
};
export default (props: AppTextInputProps) => (
  <TextInput {...props} style={{ fontFamily: 'arial_rounded', ...props.style }} />
);
