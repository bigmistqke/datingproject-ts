import React from 'react';
import {Keyboard, Pressable, Text, Button} from 'react-native';

export default props => (
  <Text {...props} style={{fontFamily: 'arial_rounded', ...props.style}} />
);
