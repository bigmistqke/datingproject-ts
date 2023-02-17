import mqtt from 'mqtt'

export default class Mqtt {
  subscriptions: Record<string, (...args: any) => void>
  base: string
  client: mqtt.MqttClient

  constructor() {
    this.subscriptions = {}
    this.base = ''
  }

  connect = async (url: string, websocket = false, ssl = false) =>
    new Promise(resolve => {
      const prefix = websocket ? (ssl ? 'wss' : 'ws') : 'mqtt'
      url = `${prefix}://${url}`

      this.client = mqtt.connect(url)
      this.client.on('message', this.receive)
      this.client.on('disconnect', () => console.error('mqtt disconnected'))
      this.client.on('connect', () => resolve(this))
    })

  private getPath = (topic: string) => `${this.base}${topic}`

  subscribe = (topic: string, callback: (msg: string, topic: string) => void) => {
    this.client.subscribe(this.getPath(topic))
    this.subscriptions[topic] = callback
  }

  unsubscribe = (topic: string) => {
    this.client.unsubscribe(topic)
    delete this.subscriptions[topic]
  }

  receive = (path: string, msg: string) => {
    for (let subscribedTopic in this.subscriptions) {
      if (subscribedTopic.includes('#')) {
        let wildcard = subscribedTopic.split('#')[0]
        if (!path.includes(wildcard)) return
        this.subscriptions[subscribedTopic](msg, path)
      } else {
        if (path !== this.getPath(subscribedTopic)) return
        this.subscriptions[subscribedTopic](msg, path)
      }
    }
  }
  send = (topic: string, msg: any) => {
    msg = typeof msg === 'string' ? msg : JSON.stringify(msg)
    this.client.publish(this.getPath(topic), msg)
  }
}
