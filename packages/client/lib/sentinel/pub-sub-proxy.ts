import EventEmitter from 'node:events';
import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
import { AnyRedisClientOptions } from '../client';
import { PUBSUB_TYPE, PubSubListener, PubSubTypeListeners } from '../client/pub-sub';
import { RedisNode } from './types';
import RedisClient from '../client';

type Client = RedisClient<
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RespVersions,
  TypeMapping
>;

type Subscriptions = Record<
  PUBSUB_TYPE['CHANNELS'] | PUBSUB_TYPE['PATTERNS'] | PUBSUB_TYPE['SHARDED'],
  PubSubTypeListeners
>;

type PubSubState = {
  client: Client;
  connectPromise: Promise<Client | undefined> | undefined;
};

type OnError = (err: unknown) => unknown;

export class PubSubProxy extends EventEmitter {
  #clientOptions;
  #onError;

  #node?: RedisNode;
  #state?: PubSubState;
  #subscriptions?: Subscriptions;

  constructor(
    clientOptions: AnyRedisClientOptions,
    onError: OnError
  ) {
    super();

    this.#clientOptions = clientOptions;
    this.#onError = onError;
  }

  #createClient() {
    if (this.#node === undefined) {
      throw new Error("pubSubProxy: didn't define node to do pubsub against");
    }

    return new RedisClient({
      ...this.#clientOptions,
      socket: {
        ...this.#clientOptions.socket,
        host: this.#node.host,
        port: this.#node.port
      }
    });
  }

  async #initiatePubSubClient(withSubscriptions = false) {
    const client = this.#createClient()
      .on('error', this.#onError);

    const connectPromise = client.connect()
      .then(async client => {
        if (this.#state?.client !== client) {
          // if pubsub was deactivated while connecting (`this.#pubSubClient === undefined`)
          // or if the node changed (`this.#pubSubClient.client !== client`)
          client.destroy();
          return this.#state?.connectPromise;
        }

        if (withSubscriptions && this.#subscriptions) {
          await Promise.all([
            client.extendPubSubListeners(PUBSUB_TYPE.CHANNELS, this.#subscriptions[PUBSUB_TYPE.CHANNELS]),
            client.extendPubSubListeners(PUBSUB_TYPE.PATTERNS, this.#subscriptions[PUBSUB_TYPE.PATTERNS]),
            client.extendPubSubListeners(PUBSUB_TYPE.SHARDED, this.#subscriptions[PUBSUB_TYPE.SHARDED])
          ]);
        }

        if (this.#state.client !== client) {
          // if the node changed (`this.#pubSubClient.client !== client`)
          client.destroy();
          return this.#state?.connectPromise;
        }

        this.#state!.connectPromise = undefined;
        return client;
      })
      .catch(err => {
        this.#state = undefined;
        throw err;
      });

    this.#state = {
      client,
      connectPromise
    };

    return connectPromise;
  }

  #getPubSubClient() {
    if (!this.#state) return this.#initiatePubSubClient();

    return (
      this.#state.connectPromise ??
      this.#state.client  
    );
  }

  async changeNode(node: RedisNode) {
    this.#node = node;

    if (!this.#state) return;

    // if `connectPromise` is undefined, `this.#subscriptions` is already set
    // and `this.#state.client` might not have the listeners set yet
    if (this.#state.connectPromise === undefined) {
      this.#subscriptions = {
        [PUBSUB_TYPE.CHANNELS]: this.#state.client.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
        [PUBSUB_TYPE.PATTERNS]: this.#state.client.getPubSubListeners(PUBSUB_TYPE.PATTERNS),
        [PUBSUB_TYPE.SHARDED]: this.#state.client.getPubSubListeners(PUBSUB_TYPE.SHARDED)
      };

      this.#state.client.destroy();
    }

    await this.#initiatePubSubClient(true);
  }

  /**
   * @internal
   * Snapshot the current subscriptions and tear down the local pub/sub client.
   * The multi-database client uses this to move subscriptions to another
   * sentinel member on failover; detaching here stops the old member
   * re-delivering to the same listeners after it recovers.
   */
  extractListeners(): Subscriptions {
    const subscriptions: Subscriptions = this.#subscriptions ?? (this.#state ? {
      [PUBSUB_TYPE.CHANNELS]: this.#state.client.getPubSubListeners(PUBSUB_TYPE.CHANNELS),
      [PUBSUB_TYPE.PATTERNS]: this.#state.client.getPubSubListeners(PUBSUB_TYPE.PATTERNS),
      [PUBSUB_TYPE.SHARDED]: this.#state.client.getPubSubListeners(PUBSUB_TYPE.SHARDED)
    } : {
      [PUBSUB_TYPE.CHANNELS]: new Map(),
      [PUBSUB_TYPE.PATTERNS]: new Map(),
      [PUBSUB_TYPE.SHARDED]: new Map()
    });

    this.destroy();
    return subscriptions;
  }

  /**
   * @internal
   * Adopt subscriptions captured from another member's {@link extractListeners}
   * and re-establish them against this member's current master. No-op when
   * there is nothing to move.
   */
  async adoptListeners(subscriptions: Subscriptions): Promise<void> {
    if (
      subscriptions[PUBSUB_TYPE.CHANNELS].size === 0 &&
      subscriptions[PUBSUB_TYPE.PATTERNS].size === 0 &&
      subscriptions[PUBSUB_TYPE.SHARDED].size === 0
    ) {
      return;
    }

    this.#subscriptions = subscriptions;
    await this.#initiatePubSubClient(true);
  }

  #executeCommand<T>(fn: (client: Client) => T) {
    const client = this.#getPubSubClient();
    if (client instanceof RedisClient) {
      return fn(client);
    }

    return client.then(client => {
      // if pubsub was deactivated while connecting
      if (client === undefined) return;

      return fn(client);
    }).catch(err => {
      if (this.#state?.client.isPubSubActive) {
        this.#state.client.destroy();
        this.#state = undefined;
      }

      throw err;
    });
  }

  subscribe<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#executeCommand(
      client => client.SUBSCRIBE(channels, listener, bufferMode)
    );
  }

  #unsubscribe<T>(fn: (client: Client) => Promise<T>) {
    return this.#executeCommand(async client => {
      const reply = await fn(client);

      if (!client.isPubSubActive) {
        client.destroy();
        this.#state = undefined;
      }
  
      return reply;
    });
  }

  async unsubscribe<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    return this.#unsubscribe(client => client.UNSUBSCRIBE(channels, listener, bufferMode));
  }

  async pSubscribe<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#executeCommand(
      client => client.PSUBSCRIBE(patterns, listener, bufferMode)
    );
  }

  async pUnsubscribe<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#unsubscribe(client => client.PUNSUBSCRIBE(patterns, listener, bufferMode));
  }

  sSubscribe<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#executeCommand(
      client => client.SSUBSCRIBE(channels, listener, bufferMode)
    );
  }

  async sUnsubscribe<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    return this.#unsubscribe(client => client.SUNSUBSCRIBE(channels, listener, bufferMode));
  }

  destroy() {
    this.#subscriptions = undefined;
    if (this.#state === undefined) return;
    
    // `connectPromise` already handles the case of `this.#pubSubState = undefined`
    if (!this.#state.connectPromise) {
      this.#state.client.destroy();
    }
    
    this.#state = undefined;
  }
}
