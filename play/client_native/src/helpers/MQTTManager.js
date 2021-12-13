// import MQTT from 'sp-react-native-mqtt';
import init from 'react_native_mqtt';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

function MQTTManager() {
  let client;
  let subscriptions = {};

  init({
    size: 10000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    reconnect: true,
    sync: {
    }
  });

  this.connect = ({ protocol = "ws", url, port = 1883 }) => new Promise(async (resolve, reject) => {
    function onConnectionLost(responseObject) {
      if (responseObject.errorCode !== 0) {
      }
    }

    function onMessageArrived(message) {

      processMessage({ topic: message.topic, data: message.payloadString })
    }

    client = new Paho.MQTT.Client(url, port, uuid.v4());
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => console.error(err),
      useSSL: true
    });
  })


  const processMessage = ({ topic, data }) => {
    subscriptions[topic](data)
  }

  this.send = (topic, data) => {
    if (!client.isConnected) {
      console.error('mqtt client is not connected!!!!');
      return;
    }
    client.publish(topic, data);
  }
  this.subscribe = (topic, callback) => {
    client.subscribe(topic);
    subscriptions[topic] = callback;
  }
}

export default MQTTManager
