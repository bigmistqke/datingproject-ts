/* eslint-disable react/react-in-jsx-scope */
import QRCodeScanner from 'react-native-qrcode-scanner';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';

function ScanScreen({ onRead }) {
  return (
    <QRCodeScanner onRead={e => onRead(e.data)} resizeMode="cover" cameraStyle={{ height: "100%" }} />
  );
}

export default ScanScreen;
