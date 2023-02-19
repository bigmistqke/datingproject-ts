/* exported package to https://github.com/bigmistqke/typed-mqtt */

/* eslint-disable @typescript-eslint/ban-ts-comment */
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
// @ts-expect-error
import init from 'react_native_mqtt';

/**
 * TODO: find replacement for `react_native_mqtt`
 *
 *    `react_native_mqtt` does not have proper typescript-support
 *    and works by polluting the global namespace with `Paho`
 *
 */

type Normalize<T> = T extends (...args: infer A) => infer R
  ? (...args: Normalize<A>) => Normalize<R>
  : { [K in keyof T]: Normalize<T[K]> };

type MapParts<Part> = Part extends '*' ? string : Part;
type Parts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? [MapParts<PartA>, '/', ...Parts<PartB>]
  : [Path];

type ParseKeysObject<T extends Record<string, unknown>> = {
  [K in keyof T]: [Parts<K>, T[K]];
} & {};

type PickKeysByValueType<T, PathParts extends unknown[]> = {
  [K in keyof T]: T[K] extends [infer Path extends string[], infer Value extends unknown]
    ? Path extends PathParts
      ? Value
      : PathParts extends Path
      ? Value
      : never
    : never;
}[keyof T];

type FindPath<T, Path> = Normalize<PickKeysByValueType<T, Parts<Path>>>;

type Packet = {
  topic: string;
  payloadString: string;
};

class _TypedMqtt<T extends {}, U extends {}> {
  private connection_data?: [protocol: string, url: string, port: number];
  private offline_messages: {
    topic: string;
    data: string;
  }[] = [];
  private subscriptions: Partial<Record<string, (value: T[keyof T]) => void>> = {};
  isConnected = false;
  client?: any;

  constructor() {
    init({
      size: 10000,
      storageBackend: AsyncStorage,
      defaultExpires: 1000 * 3600 * 24,
      enableCache: true,
      reconnect: true,
      keepAliveInterval: 10,
      sync: {},
    });
  }

  connect = ({
    protocol = 'ws',
    url,
    port = 1883,
  }: {
    protocol?: string;
    url: string;
    port: number;
  }) =>
    new Promise<boolean>(resolve => {
      this.connection_data = [protocol, url, port];

      // @ts-expect-error
      this.client = new Paho.MQTT.Client(url, port, uuid.v4());

      this.client.onConnectionLost = (responseObject: { errorCode: number }) => {
        const hasError = responseObject.errorCode !== 0;
        if (hasError) {
          this.isConnected = false;
        }
      };

      this.client.onMessageArrived = (packet: Packet) => {
        try {
          const { topic, payloadString } = packet;
          const data = JSON.parse(payloadString);
          // TODO: optionally validate types with Zod
          this.subscriptions[topic]?.(data as T[keyof T]);
        } catch (error) {
          console.error('error while receiving a message: ', error);
        }
      };

      this.client.disconnectedPublishing = true;

      this.client.connect({
        onSuccess: () => {
          this.isConnected = true;
          Object.keys(this.subscriptions).forEach(topic => this.client.subscribe(topic));
          resolve(true);
        },
        onFailure: (err: string) => {
          console.error(err);
          this.isConnected = false;
          resolve(false);
        },
        reconnect: true,
        keepAliveInterval: 10,
        useSSL: true,
      });
    });

  reconnect = () => {
    if (this.client && this.connection_data && !this.isConnected) {
      return this.client.connect(...this.connection_data);
    }
    return false;
  };

  disconnect = () => {
    if (this.client) {
      return this.client.disconnect();
    }
    return false;
  };

  private storeMessage = (topic: string, serialized: string) => {
    const hasOfflineMessage = this.offline_messages.find(
      om => om.topic === topic && om.data === serialized,
    );

    if (hasOfflineMessage) {
      return;
    }

    this.offline_messages.push({ topic, data: serialized });
    return;
  };

  send = <Path extends string, Result extends FindPath<U, Path>>(
    topic: Result extends never ? never : Path,
    data: Result,
  ) => {
    // TODO: optionally validate types with Zod
    const serialized = JSON.stringify(data);

    if (this.client && !this.client.isConnected()) {
      this.storeMessage(topic, serialized);
    }

    this.client.publish(topic, serialized);
  };

  unsubscribe = <Path extends string, Result extends FindPath<U, Path>>(
    topic: Result extends never ? never : Path,
  ) => {
    this.client.unsubscribe(topic);
    if (typeof topic === 'string') {
      delete this.subscriptions[topic];
    }
  };

  subscribe = <
    Path extends string,
    Result extends Normalize<PickKeysByValueType<ParseKeysObject<T>, Parts<Path>>>,
  >(
    topic: Result extends never ? never : Path,
    callback: (value: Result) => void,
  ) => {
    this.client.subscribe(topic);
    this.subscriptions[topic as string] = callback as any;
  };
}

// extending _TypedMqtt to cache ParseKeysObject<T>
export default class TypedMqtt<T extends {}> extends _TypedMqtt<T, ParseKeysObject<T>> {
  constructor() {
    super();
  }
}
