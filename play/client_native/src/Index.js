import { Provider } from "./store/Store"
import React, { useEffect, useState, useRef, useCallback } from 'react';
import App from "./App";
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications


export default function Index() {
  return <App></App>
}