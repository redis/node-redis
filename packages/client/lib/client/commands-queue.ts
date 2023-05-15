import * as LinkedList from 'yallist';
import encodeCommand from '../RESP/encoder';
import { Decoder, PUSH_FLAGS, RESP_TYPES } from '../RESP/decoder';
import { CommandArguments, Flags, ReplyUnion, RespVersions } from '../RESP/types';
import { ChannelListeners, PubSub, PubSubCommand, PubSubListener, PubSubType, PubSubTypeListeners } from './pub-sub';
import { AbortError, ErrorReply } from '../errors';
import { EventEmitter } from 'stream';

export interface QueueCommandOptions {
  asap?: boolean;
  chainId?: symbol;
  signal?: AbortSignal;
  flags?: Flags;
}

export interface CommandWaitingToBeSent extends CommandWaitingForReply {
  args: CommandArguments;
  chainId?: symbol;
  removeAbortListener?(): void;
}

interface CommandWaitingForReply {
  resolve(reply?: unknown): void;
  reject(err: unknown): void;
  channelsCounter?: number;
  flags?: Flags;
}

export type OnShardedChannelMoved = (channel: string, listeners: ChannelListeners) => void;

const PONG = Buffer.from('pong');

const RESP2_PUSH_FLAGS = {
  ...PUSH_FLAGS,
  [RESP_TYPES.SIMPLE_STRING]: Buffer
};

export default class RedisCommandsQueue {
  private readonly _maxLength: number | null | undefined;
  private readonly _waitingToBeSent = new LinkedList<CommandWaitingToBeSent>();
  private readonly _waitingForReply = new LinkedList<CommandWaitingForReply>();
  private readonly _onShardedChannelMoved: OnShardedChannelMoved;

  private readonly _pubSub = new PubSub();

  get isPubSubActive() {
    return this._pubSub.isActive;
  }

  private _chainInExecution: symbol | undefined;

  decoder: Decoder;

  constructor(
    respVersion: RespVersions | null | undefined,
    maxLength: number | null | undefined,
    onShardedChannelMoved: EventEmitter['emit']
  ) {
    this.decoder = this._initiateDecoder(respVersion);
    this._maxLength = maxLength;
    this._onShardedChannelMoved = onShardedChannelMoved;
  }

  private _initiateDecoder(respVersion: RespVersions | null | undefined) {
    return respVersion === 3 ?
      this._initiateResp3Decoder() :
      this._initiateResp2Decoder();
  }

  private _onReply(reply: ReplyUnion) {
    this._waitingForReply.shift()!.resolve(reply);
  }

  private _onErrorReply(err: ErrorReply) {
    this._waitingForReply.shift()!.reject(err);
  }

  private _onPush(push: Array<any>) {
    // TODO: type
    if (this._pubSub.handleMessageReply(push)) return true;
  
    const isShardedUnsubscribe = PubSub.isShardedUnsubscribe(push);
    if (isShardedUnsubscribe && !this._waitingForReply.length) {
      const channel = push[1].toString();
      this._onShardedChannelMoved(
        channel,
        this._pubSub.removeShardedListeners(channel)
      );
      return true;
    } else if (isShardedUnsubscribe || PubSub.isStatusReply(push)) {
      const head = this._waitingForReply.head!.value;
      if (
        (Number.isNaN(head.channelsCounter!) && push[2] === 0) ||
        --head.channelsCounter! === 0
      ) {
        this._waitingForReply.shift()!.resolve();
      }
      return true;
    }
  }

  private _getFlags() {
    return this._waitingForReply.head!.value.flags ?? {};
  }

  private _initiateResp3Decoder() {
    return new Decoder({
      onReply: reply => this._onReply(reply),
      onErrorReply: err => this._onErrorReply(err),
      onPush: push => {
        if (!this._onPush(push)) {

        }
      },
      getFlags: () => this._getFlags()
    });
  }

  private _initiateResp2Decoder() {
    return new Decoder({
      onReply: reply => {
        if (this._pubSub.isActive && Array.isArray(reply)) {
          if (this._onPush(reply)) return;
          
          if (PONG.equals(reply[0] as Buffer)) {
            const { resolve, flags } = this._waitingForReply.shift()!,
              buffer = ((reply[1] as Buffer).length === 0 ? reply[0] : reply[1]) as Buffer;
            resolve(flags?.[RESP_TYPES.SIMPLE_STRING] === Buffer ? buffer : buffer.toString());
            return;
          }
        }

        this._onReply(reply);
      },
      onErrorReply: err => this._onErrorReply(err),
      // PUSH type does not exist in RESP2
      // PubSub is handled in onReply  
      // @ts-expect-error
      onPush: undefined,
      getFlags: () => {
        // PubSub push is an Array in RESP2
        return this._pubSub.isActive ?
          RESP2_PUSH_FLAGS :
          this._getFlags();
      }
    });
  }

  addCommand<T>(args: CommandArguments, options?: QueueCommandOptions): Promise<T> {
    if (this._maxLength && this._waitingToBeSent.length + this._waitingForReply.length >= this._maxLength) {
      return Promise.reject(new Error('The queue is full'));
    } else if (options?.signal?.aborted) {
      return Promise.reject(new AbortError());
    }

    return new Promise((resolve, reject) => {
      const node = new LinkedList.Node<CommandWaitingToBeSent>({
        args,
        chainId: options?.chainId,
        flags: options?.flags,
        resolve,
        reject
      });

      if (options?.signal) {
        const listener = () => {
          this._waitingToBeSent.removeNode(node);
          node.value.reject(new AbortError());
        };

        node.value.removeAbortListener = () => options.signal?.removeEventListener('abort', listener);

        options.signal.addEventListener('abort', listener, { once: true });
      }

      if (options?.asap) {
        this._waitingToBeSent.unshiftNode(node);
      } else {
        this._waitingToBeSent.pushNode(node);
      }
    });
  }

  subscribe<T extends boolean>(
    type: PubSubType,
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    returnBuffers?: T
  ) {
    return this._pushPubSubCommand(
      this._pubSub.subscribe(type, channels, listener, returnBuffers)
    );
  }

  unsubscribe<T extends boolean>(
    type: PubSubType,
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    returnBuffers?: T
  ) {
    return this._pushPubSubCommand(
      this._pubSub.unsubscribe(type, channels, listener, returnBuffers)
    );
  }

  resubscribe(): Promise<any> | undefined {
    const commands = this._pubSub.resubscribe();
    if (!commands.length) return;

    return Promise.all(
      commands.map(command => this._pushPubSubCommand(command))
    );
  }

  extendPubSubChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    return this._pushPubSubCommand(
      this._pubSub.extendChannelListeners(type, channel, listeners)
    );
  }

  extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    return this._pushPubSubCommand(
      this._pubSub.extendTypeListeners(type, listeners)
    );
  }

  getPubSubListeners(type: PubSubType) {
    return this._pubSub.getTypeListeners(type);
  }

  private _pushPubSubCommand(command: PubSubCommand) {
    if (command === undefined) return;

    return new Promise<void>((resolve, reject) => {
      this._waitingToBeSent.push({
        args: command.args,
        channelsCounter: command.channelsCounter,
        flags: PUSH_FLAGS,
        resolve: () => {
          command.resolve();
          resolve();
        },
        reject: err => {
          command.reject?.();
          reject(err);
        }
      });
    });
  }

  getCommandToSend(): CommandArguments | undefined {
    const toSend = this._waitingToBeSent.shift();
    if (!toSend) return;

    let encoded: CommandArguments;
    try {
      encoded = encodeCommand(toSend.args);
    } catch (err) {
      toSend.reject(err);
      return;
    }

    // TODO
    // reuse `toSend`
    (toSend.args as any) = undefined;
    if (toSend.removeAbortListener) {
      toSend.removeAbortListener();
      (toSend.removeAbortListener as any) = undefined;
    }
    this._waitingForReply.push(toSend);
    this._chainInExecution = toSend.chainId;
    return encoded;
  }

  #flushWaitingForReply(err: Error): void {
    while (this._waitingForReply.head) {
      this._waitingForReply.shift()!.reject(err);
    }
  }

  static #flushWaitingToBeSent(command: CommandWaitingToBeSent, err: Error) {
    command.removeAbortListener?.();
    command.reject(err);
  }

  flushWaitingForReply(err: Error): void {
    this.decoder.reset();
    this._pubSub.reset();

    this.#flushWaitingForReply(err);

    if (!this._chainInExecution) return;

    while (this._waitingToBeSent.head?.value.chainId === this._chainInExecution) {
      RedisCommandsQueue.#flushWaitingToBeSent(
        this._waitingToBeSent.shift()!,
        err
      );
    }

    this._chainInExecution = undefined;
  }

  flushAll(err: Error): void {
    this.decoder.reset();
    this._pubSub.reset();
    this.#flushWaitingForReply(err);
    while (this._waitingToBeSent.head) {
      RedisCommandsQueue.#flushWaitingToBeSent(
        this._waitingToBeSent.shift()!,
        err
      );
    }
  }

  isEmpty() {
    return (
      this._waitingToBeSent.length === 0 &&
      this._waitingForReply.length === 0
    );
  }
}
