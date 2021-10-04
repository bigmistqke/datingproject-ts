import mqtt from "mqtt"
import { v4 as uuidv4 } from 'uuid';

export default class Mqtt {
    constructor(url, websocket = false, ssl = false) {
        let id = uuidv4();
        console.log(id);
        this.subscriptions = {};
        this.base = "";
        let prefix = websocket ? ssl ? 'wss' : 'ws' : 'mqtt';
        return this.connect(`${prefix}://${url}`);
    }
    connect = async (url) => {
        return new Promise((resolve) => {
            this.client = mqtt.connect(url);
            this.client.on('message', this.receive)
            this.client.on('disconnect', () => {
                console.log('oops disconnected');
            })
            this.client.on('connect', () => {
                console.log('connected');
                resolve(this);
            })
        })
    }

    subscribe = (topic, callback) => {
        this.client.subscribe(`${this.base}${topic}`);
        this.subscriptions[topic] = { function: callback };
    }
    receive = (topic, msg) => {
        for (let _topic in this.subscriptions) {
            if (topic === `${this.base}${_topic}`) {
                (this.subscriptions[_topic].function(msg));
            }
        }
    }
    send = (topic, msg) => {
        this.client.publish(`${this.base}${topic}`, msg)
    }
}