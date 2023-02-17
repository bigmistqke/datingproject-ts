import React from 'react';
import { TextInput } from 'react-native';

export default props => (
  <TextInput {...props} style={{ fontFamily: 'arial_rounded', ...props.style }} />
);
