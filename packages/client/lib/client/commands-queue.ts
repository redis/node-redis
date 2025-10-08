import { DoublyLinkedNode, DoublyLinkedList, EmptyAwareSinglyLinkedList } from './linked-list';
import encodeCommand from '../RESP/encoder';
import { Decoder, PUSH_TYPE_MAPPING, RESP_TYPES } from '../RESP/decoder';
import { TypeMapping, ReplyUnion, RespVersions, RedisArgument } from '../RESP/types';
import { ChannelListeners, PubSub, PubSubCommand, PubSubListener, PubSubType, PubSubTypeListeners } from './pub-sub';
import { AbortError, ErrorReply, CommandTimeoutDuringMaintenanceError, TimeoutError } from '../errors';
import { MonitorCallback } from '.';
import { dbgMaintenance } from './enterprise-maintenance-manager';

export interface CommandOptions<T = TypeMapping> {
  chainId?: symbol;
  asap?: boolean;
  abortSignal?: AbortSignal;
  /**
   * Maps between RESP and JavaScript types
   */
  typeMapping?: T;
  /**
   * Timeout for the command in milliseconds
   */
  timeout?: number;
}

export interface CommandToWrite extends CommandWaitingForReply {
  args: ReadonlyArray<RedisArgument>;
  chainId: symbol | undefined;
  abort: {
    signal: AbortSignal;
    listener: () => unknown;
  } | undefined;
  timeout: {
    signal: AbortSignal;
    listener: () => unknown;
    originalTimeout: number | undefined;
  } | undefined;
}

interface CommandWaitingForReply {
  resolve(reply?: unknown): void;
  reject(err: unknown): void;
  channelsCounter: number | undefined;
  typeMapping: TypeMapping | undefined;
}

export type OnShardedChannelMoved = (channel: string, listeners: ChannelListeners) => void;

const PONG = Buffer.from('pong'),
  RESET = Buffer.from('RESET');

const RESP2_PUSH_TYPE_MAPPING = {
  ...PUSH_TYPE_MAPPING,
  [RESP_TYPES.SIMPLE_STRING]: Buffer
};

// Try to handle a push notification. Return whether you
// successfully consumed the notification or not. This is
// important in order for the queue to be able to pass the
// notification to another handler if the current one did not
// succeed.
type PushHandler = (pushItems: Array<any>) => boolean;

export default class RedisCommandsQueue {
  readonly #respVersion;
  readonly #maxLength;
  readonly #toWrite = new DoublyLinkedList<CommandToWrite>();
  readonly #waitingForReply = new EmptyAwareSinglyLinkedList<CommandWaitingForReply>();
  readonly #onShardedChannelMoved;
  #chainInExecution: symbol | undefined;
  readonly decoder;
  readonly #pubSub = new PubSub();

  #pushHandlers: PushHandler[] = [this.#onPush.bind(this)];

  #maintenanceCommandTimeout: number | undefined

  setMaintenanceCommandTimeout(ms: number | undefined) {
    // Prevent possible api misuse
    if (this.#maintenanceCommandTimeout === ms) {
      dbgMaintenance(`Queue already set maintenanceCommandTimeout to ${ms}, skipping`);
      return;
    };

    dbgMaintenance(`Setting maintenance command timeout to ${ms}`);
    this.#maintenanceCommandTimeout = ms;

    if(this.#maintenanceCommandTimeout === undefined) {
      dbgMaintenance(`Queue will keep maintenanceCommandTimeout for exisitng commands, just to be on the safe side. New commands will receive normal timeouts`);
      return;
    }

    let counter = 0;
    const total = this.#toWrite.length;

    // Overwrite timeouts of all eligible toWrite commands
    for(const node of this.#toWrite.nodes()) {
      const command = node.value;

      // Remove timeout listener if it exists
      RedisCommandsQueue.#removeTimeoutListener(command)

      counter++;
      const newTimeout = this.#maintenanceCommandTimeout;

      // Overwrite the command's timeout
      const signal = AbortSignal.timeout(newTimeout);
      command.timeout = {
        signal,
        listener: () => {
          this.#toWrite.remove(node);
          command.reject(new CommandTimeoutDuringMaintenanceError(newTimeout));
        },
        originalTimeout: command.timeout?.originalTimeout
      };
      signal.addEventListener('abort', command.timeout.listener, { once: true });
    };
    dbgMaintenance(`Total of ${counter} of ${total} timeouts reset to ${ms}`);
  }

  get isPubSubActive() {
    return this.#pubSub.isActive;
  }

  constructor(
    respVersion: RespVersions,
    maxLength: number | null | undefined,
    onShardedChannelMoved: OnShardedChannelMoved
  ) {
    this.#respVersion = respVersion;
    this.#maxLength = maxLength;
    this.#onShardedChannelMoved = onShardedChannelMoved;
    this.decoder = this.#initiateDecoder();
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
    return false
  }

  #getTypeMapping() {
    return this.#waitingForReply.head!.value.typeMapping ?? {};
  }

  #initiateDecoder() {
    return new Decoder({
      onReply: reply => this.#onReply(reply),
      onErrorReply: err => this.#onErrorReply(err),
      //TODO: we can shave off a few cycles by not adding onPush handler at all if CSC is not used
      onPush: push => {
        for(const pushHandler of this.#pushHandlers) {
          if(pushHandler(push)) return
        }
      },
      getTypeMapping: () => this.#getTypeMapping()
    });
  }

  addPushHandler(handler: PushHandler): void {
    this.#pushHandlers.push(handler);
  }

  async waitForInflightCommandsToComplete(): Promise<void> {
    // In-flight commands already completed
    if(this.#waitingForReply.length === 0) {
      return
    };
    // Otherwise wait for in-flight commands to fire `empty` event
    return new Promise(resolve => {
      this.#waitingForReply.events.on('empty', resolve)
    });
  }

  addCommand<T>(
    args: ReadonlyArray<RedisArgument>,
    options?: CommandOptions
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
        timeout: undefined,
        resolve,
        reject,
        channelsCounter: undefined,
        typeMapping: options?.typeMapping
      };

      // If #maintenanceCommandTimeout was explicitly set, we should
      // use it instead of the timeout provided by the command
      const timeout = this.#maintenanceCommandTimeout ?? options?.timeout;
      const wasInMaintenance = this.#maintenanceCommandTimeout !== undefined;
      if (timeout) {

        const signal = AbortSignal.timeout(timeout);
        value.timeout = {
          signal,
          listener: () => {
            this.#toWrite.remove(node);
            value.reject(wasInMaintenance ? new CommandTimeoutDuringMaintenanceError(timeout) : new TimeoutError());
          },
          originalTimeout: options?.timeout
        };
        signal.addEventListener('abort', value.timeout.listener, { once: true });
      }

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

  #addPubSubCommand(command: PubSubCommand, asap = false, chainId?: symbol) {
    return new Promise<void>((resolve, reject) => {
      this.#toWrite.add({
        args: command.args,
        chainId,
        abort: undefined,
        timeout: undefined,
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

  #setupPubSubHandler() {
    // RESP3 uses `onPush` to handle PubSub, so no need to modify `onReply`
    if (this.#respVersion !== 2) return;

    this.decoder.onReply = (reply => {
      if (Array.isArray(reply)) {
        if (this.#onPush(reply)) return;

        if (PONG.equals(reply[0] as Buffer)) {
          const { resolve, typeMapping } = this.#waitingForReply.shift()!,
            buffer = ((reply[1] as Buffer).length === 0 ? reply[0] : reply[1]) as Buffer;
          resolve(typeMapping?.[RESP_TYPES.SIMPLE_STRING] === Buffer ? buffer : buffer.toString());
          return;
        }
      }

      return this.#onReply(reply);
    }) as Decoder['onReply'];
    this.decoder.getTypeMapping = () => RESP2_PUSH_TYPE_MAPPING;
  }

  subscribe<T extends boolean>(
    type: PubSubType,
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    returnBuffers?: T
  ) {
    const command = this.#pubSub.subscribe(type, channels, listener, returnBuffers);
    if (!command) return;

    this.#setupPubSubHandler();
    return this.#addPubSubCommand(command);
  }

  #resetDecoderCallbacks() {
    this.decoder.onReply = (reply => this.#onReply(reply)) as Decoder['onReply'];
    this.decoder.getTypeMapping = () => this.#getTypeMapping();
  }

  unsubscribe<T extends boolean>(
    type: PubSubType,
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    returnBuffers?: T
  ) {
    const command = this.#pubSub.unsubscribe(type, channels, listener, returnBuffers);
    if (!command) return;

    if (command && this.#respVersion === 2) {
      // RESP2 modifies `onReply` to handle PubSub (see #setupPubSubHandler)
      const { resolve } = command;
      command.resolve = () => {
        if (!this.#pubSub.isActive) {
          this.#resetDecoderCallbacks();
        }

        resolve();
      };
    }

    return this.#addPubSubCommand(command);
  }

  removeAllPubSubListeners() {
    return this.#pubSub.removeAllListeners();
  }

  resubscribe(chainId?: symbol) {
    const commands = this.#pubSub.resubscribe();
    if (!commands.length) return;

    this.#setupPubSubHandler();
    return Promise.all(
      commands.map(command => this.#addPubSubCommand(command, true, chainId))
    );
  }

  extendPubSubChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    const command = this.#pubSub.extendChannelListeners(type, channel, listeners);
    if (!command) return;

    this.#setupPubSubHandler();
    return this.#addPubSubCommand(command);
  }

  extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    const command = this.#pubSub.extendTypeListeners(type, listeners);
    if (!command) return;

    this.#setupPubSubHandler();
    return this.#addPubSubCommand(command);
  }

  getPubSubListeners(type: PubSubType) {
    return this.#pubSub.listeners[type];
  }

  monitor(callback: MonitorCallback, options?: CommandOptions) {
    return new Promise<void>((resolve, reject) => {
      const typeMapping = options?.typeMapping ?? {};
      this.#toWrite.add({
        args: ['MONITOR'],
        chainId: options?.chainId,
        abort: undefined,
        timeout: undefined,
        // using `resolve` instead of using `.then`/`await` to make sure it'll be called before processing the next reply
        resolve: () => {
          // after running `MONITOR` only `MONITOR` and `RESET` replies are expected
          // any other command should cause an error

          // if `RESET` already overrides `onReply`, set monitor as it's fallback
          if (this.#resetFallbackOnReply) {
            this.#resetFallbackOnReply = callback;
          } else {
            this.decoder.onReply = callback;
          }

          this.decoder.getTypeMapping = () => typeMapping;
          resolve();
        },
        reject,
        channelsCounter: undefined,
        typeMapping
      }, options?.asap);
    });
  }

  resetDecoder() {
    this.#resetDecoderCallbacks();
    this.decoder.reset();
  }

  #resetFallbackOnReply?: Decoder['onReply'];

  async reset<T extends TypeMapping>(chainId: symbol, typeMapping?: T) {
    return new Promise((resolve, reject) => {
      // overriding onReply to handle `RESET` while in `MONITOR` or PubSub mode
      this.#resetFallbackOnReply = this.decoder.onReply;
      this.decoder.onReply = (reply => {
        if (
          (typeof reply === 'string' && reply === 'RESET') ||
          (reply instanceof Buffer && RESET.equals(reply))
        ) {
          this.#resetDecoderCallbacks();
          this.#resetFallbackOnReply = undefined;
          this.#pubSub.reset();

          this.#waitingForReply.shift()!.resolve(reply);
          return;
        }

        this.#resetFallbackOnReply!(reply);
      }) as Decoder['onReply'];

      this.#toWrite.push({
        args: ['RESET'],
        chainId,
        abort: undefined,
        timeout: undefined,
        resolve,
        reject,
        channelsCounter: undefined,
        typeMapping
      });
    });
  }

  isWaitingToWrite() {
    return this.#toWrite.length > 0;
  }

  *commandsToWrite() {
    let toSend = this.#toWrite.shift();
    while (toSend) {
      let encoded: ReadonlyArray<RedisArgument>
      try {
        encoded = encodeCommand(toSend.args);
      } catch (err) {
        toSend.reject(err);
        toSend = this.#toWrite.shift();
        continue;
      }

      // TODO reuse `toSend` or create new object?
      (toSend as any).args = undefined;
      if (toSend.abort) {
        RedisCommandsQueue.#removeAbortListener(toSend);
        toSend.abort = undefined;
      }
      if (toSend.timeout) {
        RedisCommandsQueue.#removeTimeoutListener(toSend);
        toSend.timeout = undefined;
      }
      this.#chainInExecution = toSend.chainId;
      toSend.chainId = undefined;
      this.#waitingForReply.push(toSend);

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

  static #removeTimeoutListener(command: CommandToWrite) {
    command.timeout?.signal.removeEventListener('abort', command.timeout!.listener);
  }

  static #flushToWrite(toBeSent: CommandToWrite, err: Error) {
    if (toBeSent.abort) {
      RedisCommandsQueue.#removeAbortListener(toBeSent);
    }
    if (toBeSent.timeout) {
      RedisCommandsQueue.#removeTimeoutListener(toBeSent);
    }

    toBeSent.reject(err);
  }

  flushWaitingForReply(err: Error): void {
    this.resetDecoder();
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
    this.resetDecoder();
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
