// import MQTT from 'sp-react-native-mqtt';
import init from 'react_native_mqtt';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

function MQTTManager() {
    let client;
    let subscriptions;

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

        function onConnect() {
            console.log("onConnect");
            client.subscribe("/test")
        }

        function onConnectionLost(responseObject) {
            if (responseObject.errorCode !== 0) {
                console.log("onConnectionLost:" + responseObject.errorMessage);
            }
        }

        function onMessageArrived(message) {
            console.log("onMessageArrived:" + message.payloadString);
        }

        client = new Paho.MQTT.Client(url, 443, uuid.v4());
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;
        client.connect({ onSuccess: onConnect, useSSL: true });
    })


    const processMessage = ({ topic, data }) => this.subscriptions[topic](data)

    this.send = (topic, data) => client.publish(topic, data)
    this.subscribe = (topic, callback) => {
        client.subscribe(topic);
        subscriptions[topic] = callback;
    }
}

export default MQTTManager
