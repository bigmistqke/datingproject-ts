import Paho from "paho-mqtt"
import { v4 as uuidv4 } from 'uuid';

export default class Mqtt {
    constructor(url, websocket = false) {
        let id = uuidv4();
        console.log(id);
        this.client = new Paho.Client(`wss://${url}`, id);
        this.subscriptions = {};
        this.base = "";
        return this.connect();
    }
    connect = () => {
        return new Promise((resolve) => {
            this.client.connect({
                onSuccess: () => {
                    this.client.onMessageArrived = this.receive;
                    resolve(this);
                }
            })
        })
    }

    subscribe = (topic, callback) => {
        this.client.subscribe(`${this.base}${topic}`);
        this.subscriptions[topic] = { function: callback };
    }
    receive = ({ destinationName: topic, payloadString: msg }) => {
        for (let _topic in this.subscriptions) {
            if (topic === `${this.base}${_topic}`) {
                (this.subscriptions[_topic].function(msg));
            }
        }
    }
    send = (topic, msg) => {
        const message = new Paho.Message(msg);
        message.destinationName = `${this.base}${topic}`;
        this.client.send(message)
    }
}