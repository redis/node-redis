import { SinglyLinkedList, DoublyLinkedNode, DoublyLinkedList } from './linked-list';
import encodeCommand from '../RESP/encoder';
import { Decoder, PUSH_TYPE_MAPPING, RESP_TYPES } from '../RESP/decoder';
import { CommandArguments, TypeMapping, ReplyUnion, RespVersions } from '../RESP/types';
import { ChannelListeners, PubSub, PubSubCommand, PubSubListener, PubSubType, PubSubTypeListeners } from './pub-sub';
import { AbortError, ErrorReply } from '../errors';
import { EventEmitter } from 'node:stream';
import { MonitorCallback } from '.';

export interface CommandOptions<T = TypeMapping> {
  chainId?: symbol;
  asap?: boolean;
  abortSignal?: AbortSignal;
  /**
   * Maps between RESP and JavaScript types
   */
  typeMapping?: T;
}

export interface CommandToWrite extends CommandWaitingForReply {
  args: CommandArguments;
  chainId?: symbol;
  abort?: {
    signal: AbortSignal;
    listener: () => unknown;
  };
  resolveOnWrite?: boolean;
}

interface CommandWaitingForReply {
  resolve(reply?: unknown): void;
  reject(err: unknown): void;
  channelsCounter?: number;
  typeMapping?: TypeMapping;
}

export type OnShardedChannelMoved = (channel: string, listeners: ChannelListeners) => void;

const PONG = Buffer.from('pong');

const RESP2_PUSH_TYPE_MAPPING = {
  ...PUSH_TYPE_MAPPING,
  [RESP_TYPES.SIMPLE_STRING]: Buffer
};

export default class RedisCommandsQueue {
  readonly #maxLength: number | null | undefined;
  readonly #toWrite = new DoublyLinkedList<CommandToWrite>();
  readonly #waitingForReply = new SinglyLinkedList<CommandWaitingForReply>();
  readonly #onShardedChannelMoved: OnShardedChannelMoved;

  readonly #pubSub = new PubSub();

  get isPubSubActive() {
    return this.#pubSub.isActive;
  }

  #chainInExecution: symbol | undefined;

  decoder: Decoder;

  constructor(
    respVersion: RespVersions | null | undefined,
    maxLength: number | null | undefined,
    onShardedChannelMoved: EventEmitter['emit']
  ) {
    this.decoder = this.#initiateDecoder(respVersion);
    this.#maxLength = maxLength;
    this.#onShardedChannelMoved = onShardedChannelMoved;
  }

  #initiateDecoder(respVersion: RespVersions | null | undefined) {
    return respVersion === 3 ?
      this.#initiateResp3Decoder() :
      this.#initiateResp2Decoder();
  }

  #onReply(reply: ReplyUnion) {
    this.#waitingForReply.shift()!.resolve(reply);
  }

  #onErrorReply(err: ErrorReply) {
    this.#waitingForReply.shift()!.reject(err);
  }

  #onPush(push: Array<any>) {
    // TODO: type
    if (this.#pubSub.handleMessageReply(push)) return true;
  
    const isShardedUnsubscribe = PubSub.isShardedUnsubscribe(push);
    if (isShardedUnsubscribe && !this.#waitingForReply.length) {
      const channel = push[1].toString();
      this.#onShardedChannelMoved(
        channel,
        this.#pubSub.removeShardedListeners(channel)
      );
      return true;
    } else if (isShardedUnsubscribe || PubSub.isStatusReply(push)) {
      const head = this.#waitingForReply.head!.value;
      if (
        (Number.isNaN(head.channelsCounter!) && push[2] === 0) ||
        --head.channelsCounter! === 0
      ) {
        this.#waitingForReply.shift()!.resolve();
      }
      return true;
    }
  }

  #getTypeMapping() {
    return this.#waitingForReply.head!.value.typeMapping ?? {};
  }

  #initiateResp3Decoder() {
    return new Decoder({
      onReply: reply => this.#onReply(reply),
      onErrorReply: err => this.#onErrorReply(err),
      onPush: push => {
        if (!this.#onPush(push)) {

        }
      },
      getTypeMapping: () => this.#getTypeMapping()
    });
  }

  #initiateResp2Decoder() {
    return new Decoder({
      onReply: reply => {
        if (this.#pubSub.isActive && Array.isArray(reply)) {
          if (this.#onPush(reply)) return;
          
          if (PONG.equals(reply[0] as Buffer)) {
            const { resolve, typeMapping } = this.#waitingForReply.shift()!,
              buffer = ((reply[1] as Buffer).length === 0 ? reply[0] : reply[1]) as Buffer;
            resolve(typeMapping?.[RESP_TYPES.SIMPLE_STRING] === Buffer ? buffer : buffer.toString());
            return;
          }
        }

        this.#onReply(reply);
      },
      onErrorReply: err => this.#onErrorReply(err),
      // PUSH type does not exist in RESP2
      // PubSub is handled in onReply  
      // @ts-expect-error
      onPush: undefined,
      getTypeMapping: () => {
        // PubSub push is an Array in RESP2
        return this.#pubSub.isActive ?
          RESP2_PUSH_TYPE_MAPPING :
          this.#getTypeMapping();
      }
    });
  }
  
  async monitor(callback: MonitorCallback, typeMapping: TypeMapping = {}, asap = false) {
    await this.addCommand(
      ['MONITOR'],
      { asap },
      true
    );

    const { onReply, getTypeMapping } = this.decoder;
    this.decoder.onReply = callback;
    this.decoder.getTypeMapping = () => typeMapping;
    return () => new Promise<void>(async resolve => {
      await this.addCommand(['RESET'], undefined, true);
      this.decoder.onReply = (reply: string) => {
        if (reply !== 'RESET') return callback(reply);
        this.decoder.onReply = onReply;
        this.decoder.getTypeMapping = getTypeMapping;
        resolve();
      };
    });
  }

  addCommand<T>(
    args: CommandArguments,
    options?: CommandOptions,
    resolveOnWrite?: boolean
  ): Promise<T> {
    if (this.#maxLength && this.#toWrite.length + this.#waitingForReply.length >= this.#maxLength) {
      return Promise.reject(new Error('The queue is full'));
    } else if (options?.abortSignal?.aborted) {
      return Promise.reject(new AbortError());
    }

    return new Promise((resolve, reject) => {
      let node: DoublyLinkedNode<CommandToWrite>;
      const value: CommandToWrite = {
        args,
        chainId: options?.chainId,
        abort: undefined,
        resolveOnWrite,
        resolve,
        reject,
        channelsCounter: undefined,
        typeMapping: options?.typeMapping
      };

      const signal = options?.abortSignal;
      if (signal) {
        value.abort = {
          signal,
          listener: () => {
            this.#toWrite.remove(node);
            value.reject(new AbortError());
          }
        };
        signal.addEventListener('abort', value.abort.listener, { once: true });
      }

      node = this.#toWrite.add(value, options?.asap);
    });
  }

  subscribe<T extends boolean>(
    type: PubSubType,
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    returnBuffers?: T
  ) {
    return this.#addPubSubCommand(
      this.#pubSub.subscribe(type, channels, listener, returnBuffers)
    );
  }

  unsubscribe<T extends boolean>(
    type: PubSubType,
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    returnBuffers?: T
  ) {
    return this.#addPubSubCommand(
      this.#pubSub.unsubscribe(type, channels, listener, returnBuffers)
    );
  }

  resubscribe(): Promise<any> | undefined {
    const commands = this.#pubSub.resubscribe();
    if (!commands.length) return;

    return Promise.all(
      commands.map(command => this.#addPubSubCommand(command, true))
    );
  }

  extendPubSubChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    return this.#addPubSubCommand(
      this.#pubSub.extendChannelListeners(type, channel, listeners)
    );
  }

  extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    return this.#addPubSubCommand(
      this.#pubSub.extendTypeListeners(type, listeners)
    );
  }

  getPubSubListeners(type: PubSubType) {
    return this.#pubSub.getTypeListeners(type);
  }

  #addPubSubCommand(command: PubSubCommand, asap = false) {
    if (command === undefined) return;

    return new Promise<void>((resolve, reject) => {
      this.#toWrite.add({
        args: command.args,
        chainId: undefined,
        abort: undefined,
        resolveOnWrite: false,
        resolve() {
          command.resolve();
          resolve();
        },
        reject(err) {
          command.reject?.();
          reject(err);
        },
        channelsCounter: command.channelsCounter,
        typeMapping: PUSH_TYPE_MAPPING
      }, asap);
    });
  }

  isWaitingToWrite() {
    return this.#toWrite.length > 0;
  }

  *commandsToWrite() {
    let toSend = this.#toWrite.shift();
    while (toSend) {
      let encoded: CommandArguments;
      try {
        encoded = encodeCommand(toSend.args);
      } catch (err) {
        toSend.reject(err);
        toSend = this.#toWrite.shift();
        continue;
      }

      if (toSend.abort) {
        RedisCommandsQueue.#removeAbortListener(toSend);
        toSend.abort = undefined;
      }

      if (toSend.resolveOnWrite) {
        toSend.resolve();
      } else {
        // TODO reuse `toSend` or create new object? 
        (toSend as any).args = undefined;

        this.#chainInExecution = toSend.chainId;
        toSend.chainId = undefined;

        this.#waitingForReply.push(toSend);
      }
      
      yield encoded;
      toSend = this.#toWrite.shift();
    }
  }

  #flushWaitingForReply(err: Error): void {
    for (const node of this.#waitingForReply) {
      node.reject(err);
    }
    this.#waitingForReply.reset();
  }

  static #removeAbortListener(command: CommandToWrite) {
    command.abort!.signal.removeEventListener('abort', command.abort!.listener);
  }

  static #flushToWrite(toBeSent: CommandToWrite, err: Error) {
    if (toBeSent.abort) {
      RedisCommandsQueue.#removeAbortListener(toBeSent);
    }
    
    toBeSent.reject(err);
  }

  flushWaitingForReply(err: Error): void {
    this.decoder.reset();
    this.#pubSub.reset();

    this.#flushWaitingForReply(err);

    if (!this.#chainInExecution) return;

    while (this.#toWrite.head?.value.chainId === this.#chainInExecution) {
      RedisCommandsQueue.#flushToWrite(
        this.#toWrite.shift()!,
        err
      );
    }

    this.#chainInExecution = undefined;
  }

  flushAll(err: Error): void {
    this.decoder.reset();
    this.#pubSub.reset();
    this.#flushWaitingForReply(err);
    for (const node of this.#toWrite) {
      RedisCommandsQueue.#flushToWrite(node, err);
    }
    this.#toWrite.reset();
  }

  isEmpty() {
    return (
      this.#toWrite.length === 0 &&
      this.#waitingForReply.length === 0
    );
  }
}
