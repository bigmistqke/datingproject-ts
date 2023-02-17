

import React, { } from 'react';
import App from "./App";
import { LogBox } from 'react-native';
import 'react-native-gesture-handler';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

export default function Index() {
  return <App></App>
}