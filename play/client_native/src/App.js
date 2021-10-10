import React, { useEffect } from 'react';
import { Button, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import ScanScreen from './screens/ScanScreen';
import MQTT from 'sp-react-native-mqtt';

import MQTTManager from './helpers/MQTTManager';


function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ScanScreen></ScanScreen>
    </View>
  );
}

function DetailsScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      <Button
        title="Go to Details... again"
        onPress={() => navigation.push('Home')}
      />
    </View>
  );
}

const Stack = createNativeStackNavigator();



function App() {
  /* create mqtt client */

  useEffect(() => {
    const connect = async function () {
      let mqttManager = new MQTTManager();
      let isConnected = await mqttManager.connect({ url: 'socket.datingproject.netr' });
      console.log("isConnected is", isConnected);

    }
    connect();

  }, [])


  const options = {
    headerShown: false,
    animationEnabled: false
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" >
        <Stack.Screen name="Home" component={HomeScreen} options={options} />
        <Stack.Screen name="Details" component={DetailsScreen} options={options} />
      </Stack.Navigator>
    </NavigationContainer >
  );
}

export default App;
