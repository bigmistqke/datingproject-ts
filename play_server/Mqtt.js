const mqtt = require('mqtt')
const { v4 } = require('uuid');

class Mqtt {
    constructor(url, websocket = false) {
        let id = v4();
        console.log(id);
        this.client = new mqtt.connect(`mqtt://${url}:${websocket ? 8883 : 1883}`, id);
        this.subscriptions = {};
        this.base = "";
        return this.connect();
    }
    connect = () => {
        return new Promise((resolve) => {
            this.client.on('connect', () => {
                this.client.on('message', this.receive)
                resolve(this);
            })
        })
    }

    subscribe = (topic, callback) => {
        this.client.subscribe(`${this.base}${topic}`);
        this.subscriptions[topic] = { function: callback };
    }
    receive = (topic, message) => {
        for (let _topic in this.subscriptions) {
            if (topic === `${this.base}${_topic}`) {
                (this.subscriptions[_topic].function(message.toString()));
            }
        }
    }
    send = (topic, msg) => {
        this.client.publish(topic, msg)
    }
}

module.exports = Mqtt;