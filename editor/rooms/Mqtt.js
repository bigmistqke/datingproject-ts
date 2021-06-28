const mqtt = require('mqtt')
const { v4 } = require('uuid');

class Mqtt {
    constructor(url, ws = false) {
        this.subscriptions = {};
        this.base = "";
        return this.connect(url, ws);
    }
    connect = async (url, ws) => {
        return new Promise((resolve) => {
            this.client = mqtt.connect(`${ws ? 'ws' : 'mqtt'}://${url}:${ws ? 8883 : 1883}`, v4());
            this.client.on('connect', () => {
                ////console.log('ok');
                this.client.on('message', this.receive)
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

module.exports = Mqtt;