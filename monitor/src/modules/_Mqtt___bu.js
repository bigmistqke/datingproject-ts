// const mqtt = require('mqtt');
import mqtt from 'mqtt';

export default class _Mqtt {
    constructor() {
        this.subscriptions = {};
        this.base = "";
    }
    connect = async (url, websocket = false, ssl = false) => {
        let prefix = websocket ? ssl ? 'wss' : 'ws' : 'mqtt';
        url = `${prefix}://${url}`;
        console.log(url);
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
            if (_topic.indexOf('#') != -1) {
                let wildcard = _topic.split('#')[0];
                if (topic.indexOf(wildcard) != -1) {
                    this.subscriptions[_topic].function(msg, topic);
                }
            } else {
                if (topic === `${this.base}${_topic}`) {
                    (this.subscriptions[_topic].function(msg, topic));
                }
            }


        }
    }
    send = (topic, msg) => {
        this.client.publish(`${this.base}${topic}`, msg)
    }
}

// module.exports = _Mqtt;