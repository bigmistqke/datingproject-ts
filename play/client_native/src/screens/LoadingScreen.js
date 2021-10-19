/* eslint-disable react/react-in-jsx-scope */
import QRCodeScanner from 'react-native-qrcode-scanner';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import React, { useEffect, progress } from 'react';

export default function LoadingScreen({ loading_message }) {

    return (
        <Text>{loading_message} hallo</Text>
    );
}
