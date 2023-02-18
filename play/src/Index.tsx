import React from 'react'
import { LogBox } from 'react-native'
import 'react-native-gesture-handler'
import App from './App'

LogBox.ignoreLogs(['new NativeEventEmitter']) // Ignore log notification by message
LogBox.ignoreAllLogs() //Ignore all log notifications

export default () => <App />
