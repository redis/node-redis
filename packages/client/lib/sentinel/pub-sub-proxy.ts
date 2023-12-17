import EventEmitter from "events";
import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping } from "../RESP/types";
import { RedisClientOptions, RedisClientType } from "../client";
import { PubSubListener, PubSubType, PubSubTypeListeners } from "../client/pub-sub";
import { ClientErrorEvent, RedisNode } from "./types";
import RedisClient from "../client";
import { clientSocketToNode } from "./utils";

interface PubSubNode<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> {
  destroy: boolean;
  client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
  connectPromise?: Promise<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>;
}

export class PubSubProxy<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends EventEmitter {
  readonly #passthroughClientErrorEvents: boolean;

  #channelsListeners?: PubSubTypeListeners;
  #patternsListeners?: PubSubTypeListeners;

  #node?: RedisNode;
  #clientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;

  #pubSubNode?: PubSubNode<M, F, S, RESP, TypeMapping>;

  constructor(clientOptions: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, passthroughErrors = false) {
    super();

    this.#clientOptions = clientOptions;
    this.#passthroughClientErrorEvents = passthroughErrors;
  }

  #createClient(): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
    if (this.#node === undefined) {
      throw new Error("pubSubProxy: didn't define node to do pubsub against");
    }

    const options = { ...this.#clientOptions } as RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>;

    if (this.#clientOptions.socket) {
      options.socket = { ...this.#clientOptions.socket };
    } else {
      options.socket = {};
    }

    options.socket.host = this.#node.host;
    options.socket.port = this.#node.port;

    return RedisClient.create(options);
  }

  async changeNode(node: RedisNode) {
    this.#node = node;

    if (this.#pubSubNode) {
      this.destroy();
    }

    if (this.#hasSavedListeners()) {
      await this.#initiatePubSubClient();
    }
  }

  async close() {
    if (this.#pubSubNode) {
      if (this.#pubSubNode.connectPromise === undefined) {
        const client = this.#pubSubNode.client;

        this.#pubSubNode = undefined;

        if (client.isOpen) {
          await client.close();
        }
      } else {
        this.#pubSubNode.destroy = true;
        await this.#pubSubNode.connectPromise;
      }
    }
  }

  destroy() {
    if (this.#pubSubNode) {
      if (this.#pubSubNode.connectPromise === undefined) {
        const client = this.#pubSubNode.client;

        this.#pubSubNode = undefined;
        if (client.isOpen) {
          client.destroy();
        }
      } else {
        this.#pubSubNode.destroy = true;
      }
    }
  }

  async #initiatePubSubClient() {
    const client = this.#createClient();
    client.on("error", (err: Error) => {
      if (this.#passthroughClientErrorEvents) {
        this.emit('error', new Error(`PubSub Proxy Client (${this.#node!.host}:${this.#node!.port}): ${err.message}`, {cause: err}));
      }
      const event: ClientErrorEvent = {
        type: 'SENTINEL',
        node: clientSocketToNode(client.options!.socket!),
        error: err
      };
      this.emit('client-error', event);
    });

    this.#pubSubNode = {
      destroy: false,
      client: client,
      connectPromise: client.connect()
        .then(async client => {
          if (this.#channelsListeners && this.#channelsListeners.size > 0) {
            await client.extendPubSubListeners(PubSubType.CHANNELS, this.#channelsListeners)
          }
          // get the new channelsListeners object
          this.#channelsListeners = client.getPubSubListeners(PubSubType.CHANNELS);
          if (this.#patternsListeners && this.#patternsListeners.size > 0) {
            await client.extendPubSubListeners(PubSubType.PATTERNS, this.#patternsListeners);
          }
          // get the new patternsListeners object
          this.#patternsListeners = client.getPubSubListeners(PubSubType.PATTERNS);

          this.#pubSubNode!.connectPromise = undefined;
          if (this.#pubSubNode?.destroy) {
            this.destroy()
          }
          return client;
        })
        .catch(err => {
          this.#pubSubNode = undefined;
          throw err;
        })
    };

    return this.#pubSubNode.connectPromise!;
  }

  #getPubSubClient() {
    if (!this.#pubSubNode) return this.#initiatePubSubClient();

    return this.#pubSubNode.connectPromise ?? this.#pubSubNode.client;
  }

  async subscribe<T extends boolean = false>(
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {   
    const client = await this.#getPubSubClient();
    const resp = await client.SUBSCRIBE(channels, listener, bufferMode);

    return resp;
  }

  async unsubscribe<T extends boolean = false>(
    channels?: string | Array<string>,
    listener?: PubSubListener<boolean>,
    bufferMode?: T
  ) {
    const client = await this.#getPubSubClient();
    const resp = await client.UNSUBSCRIBE(channels, listener, bufferMode);

    if (!client.isPubSubActive) {
      client.destroy();
      this.#pubSubNode = undefined;
    }

    return resp;
  }

  async pSubscribe<T extends boolean = false>(
    patterns: string | Array<string>,
    listener: PubSubListener<T>,
    bufferMode?: T
  ) {
    const client = await this.#getPubSubClient();
    const resp = await client.PSUBSCRIBE(patterns, listener, bufferMode);

    return resp;
  }

  async pUnsubscribe<T extends boolean = false>(
    patterns?: string | Array<string>,
    listener?: PubSubListener<T>,
    bufferMode?: T
  ) {
    const client = await this.#getPubSubClient();
    const resp = await client.PUNSUBSCRIBE(patterns, listener, bufferMode);

    if (!client.isPubSubActive) {
      client.destroy();
      this.#pubSubNode = undefined;
    }

    return resp;
  }

  #hasSavedListeners(): boolean {
    var channels = this.#channelsListeners !== undefined && this.#channelsListeners.size > 0;
    var patterns = this.#patternsListeners !== undefined && this.#patternsListeners.size > 0;

    return channels || patterns;
  }
}