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
  private readonly _maxLength: number | null | undefined;
  private readonly _toWrite = new DoublyLinkedList<CommandToWrite>();
  private readonly _waitingForReply = new SinglyLinkedList<CommandWaitingForReply>();
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

  private _getTypeMapping() {
    return this._waitingForReply.head!.value.typeMapping ?? {};
  }

  private _initiateResp3Decoder() {
    return new Decoder({
      onReply: reply => this._onReply(reply),
      onErrorReply: err => this._onErrorReply(err),
      onPush: push => {
        if (!this._onPush(push)) {

        }
      },
      getTypeMapping: () => this._getTypeMapping()
    });
  }

  private _initiateResp2Decoder() {
    return new Decoder({
      onReply: reply => {
        if (this._pubSub.isActive && Array.isArray(reply)) {
          if (this._onPush(reply)) return;
          
          if (PONG.equals(reply[0] as Buffer)) {
            const { resolve, typeMapping } = this._waitingForReply.shift()!,
              buffer = ((reply[1] as Buffer).length === 0 ? reply[0] : reply[1]) as Buffer;
            resolve(typeMapping?.[RESP_TYPES.SIMPLE_STRING] === Buffer ? buffer : buffer.toString());
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
      getTypeMapping: () => {
        // PubSub push is an Array in RESP2
        return this._pubSub.isActive ?
          RESP2_PUSH_TYPE_MAPPING :
          this._getTypeMapping();
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
    if (this._maxLength && this._toWrite.length + this._waitingForReply.length >= this._maxLength) {
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
            this._toWrite.remove(node);
            value.reject(new AbortError());
          }
        };
        signal.addEventListener('abort', value.abort.listener, { once: true });
      }

      node = this._toWrite.add(value, options?.asap);
    });
  }

  subscribe<T extends boolean>(
    type: PubSubType,
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    returnBuffers?: T
  ) {
    return this._addPubSubCommand(
      this._pubSub.subscribe(type, channels, listener, returnBuffers)
    );
  }

  unsubscribe<T extends boolean>(
    type: PubSubType,
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    returnBuffers?: T
  ) {
    return this._addPubSubCommand(
      this._pubSub.unsubscribe(type, channels, listener, returnBuffers)
    );
  }

  resubscribe(): Promise<any> | undefined {
    const commands = this._pubSub.resubscribe();
    if (!commands.length) return;

    return Promise.all(
      commands.map(command => this._addPubSubCommand(command, true))
    );
  }

  extendPubSubChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    return this._addPubSubCommand(
      this._pubSub.extendChannelListeners(type, channel, listeners)
    );
  }

  extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    return this._addPubSubCommand(
      this._pubSub.extendTypeListeners(type, listeners)
    );
  }

  getPubSubListeners(type: PubSubType) {
    return this._pubSub.getTypeListeners(type);
  }

  private _addPubSubCommand(command: PubSubCommand, asap = false) {
    if (command === undefined) return;

    return new Promise<void>((resolve, reject) => {
      this._toWrite.add({
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
    return this._toWrite.length > 0;
  }

  *commandsToWrite() {
    let toSend = this._toWrite.shift();
    while (toSend) {
      let encoded: CommandArguments;
      try {
        encoded = encodeCommand(toSend.args);
      } catch (err) {
        toSend.reject(err);
        toSend = this._toWrite.shift();
        continue;
      }

      if (toSend.abort) {
        RedisCommandsQueue._removeAbortListener(toSend);
        toSend.abort = undefined;
      }

      if (toSend.resolveOnWrite) {
        toSend.resolve();
      } else {
        // TODO reuse `toSend` or create new object? 
        (toSend as any).args = undefined;

        this._chainInExecution = toSend.chainId;
        toSend.chainId = undefined;

        this._waitingForReply.push(toSend);
      }
      
      yield encoded;
      toSend = this._toWrite.shift();
    }
  }

  private _flushWaitingForReply(err: Error): void {
    for (const node of this._waitingForReply) {
      node.reject(err);
    }
    this._waitingForReply.reset();
  }

  private static _removeAbortListener(command: CommandToWrite) {
    command.abort!.signal.removeEventListener('abort', command.abort!.listener);
  }

  private static _flushToWrite(toBeSent: CommandToWrite, err: Error) {
    if (toBeSent.abort) {
      RedisCommandsQueue._removeAbortListener(toBeSent);
    }
    
    toBeSent.reject(err);
  }

  flushWaitingForReply(err: Error): void {
    this.decoder.reset();
    this._pubSub.reset();

    this._flushWaitingForReply(err);

    if (!this._chainInExecution) return;

    while (this._toWrite.head?.value.chainId === this._chainInExecution) {
      RedisCommandsQueue._flushToWrite(
        this._toWrite.shift()!,
        err
      );
    }

    this._chainInExecution = undefined;
  }

  flushAll(err: Error): void {
    this.decoder.reset();
    this._pubSub.reset();
    this._flushWaitingForReply(err);
    for (const node of this._toWrite) {
      RedisCommandsQueue._flushToWrite(node, err);
    }
    this._toWrite.reset();
  }

  isEmpty() {
    return (
      this._toWrite.length === 0 &&
      this._waitingForReply.length === 0
    );
  }
}
