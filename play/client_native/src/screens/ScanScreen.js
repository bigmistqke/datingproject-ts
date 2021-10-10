/* eslint-disable react/react-in-jsx-scope */
import QRCodeScanner from 'react-native-qrcode-scanner';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';

function ScanScreen({ setUrl }) {
  const onSuccess = e => {
    setUrl(e.data)
  };
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <QRCodeScanner onSuccess={onSuccess} resizeMode="cover" cameraStyle={{ height: "100%" }} />
    </View>
  );
}

export default ScanScreen;
