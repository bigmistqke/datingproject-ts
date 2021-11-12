import mqtt from "mqtt"

export default class Mqtt {


    constructor() {
        this.subscriptions = {};
        this.base = "";
    }
    connect = async (url, websocket = true, ssl = true) => {
        let prefix = websocket ? ssl ? 'wss' : 'ws' : 'mqtt';
        // return this.connect(`${prefix}://${url}`);

        return new Promise((resolve) => {
            this.client = mqtt.connect(`${prefix}://${url}`);
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