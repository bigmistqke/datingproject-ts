import MQTT from 'sp-react-native-mqtt';
// import uuid from 'react-native-uuid';

function MQTTManager() {
    let client;
    let subscriptions;

    this.connect = ({ protocol = "ws", url, port = 1883 }) => new Promise(async (resolve, reject) => {
        client = await MQTT.createClient({
            uri: `ws://${url}:8883`,
            clientId: "qekgqjegljqekgj"
        })

        client.on('closed', () => console.error('mqtt.event.closed'))
        client.on('error', (err) => reject)
        client.on('message', processMessage);
        client.on('connect', resolve);
        client.connect();
    })


    const processMessage = ({ topic, data }) => this.subscriptions[topic](data)

    this.send = (topic, data) => client.publish(topic, data)
    this.subscribe = (topic, callback) => {
        client.subscribe(topic);
        subscriptions[topic] = callback;
    }
}

export default MQTTManager
