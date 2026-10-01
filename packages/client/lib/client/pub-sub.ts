import { RedisArgument } from '../RESP/types';
import { CommandToWrite } from './commands-queue';
import calculateSlot from '../utils/calculate-slot';
import { publish, CHANNELS } from './tracing';

export const PUBSUB_TYPE = {
  CHANNELS: 'CHANNELS',
  PATTERNS: 'PATTERNS',
  SHARDED: 'SHARDED'
} as const;

export type PUBSUB_TYPE = typeof PUBSUB_TYPE;

export type PubSubType = PUBSUB_TYPE[keyof PUBSUB_TYPE];

const COMMANDS = {
  [PUBSUB_TYPE.CHANNELS]: {
    subscribe: Buffer.from('subscribe'),
    unsubscribe: Buffer.from('unsubscribe'),
    message: Buffer.from('message')
  },
  [PUBSUB_TYPE.PATTERNS]: {
    subscribe: Buffer.from('psubscribe'),
    unsubscribe: Buffer.from('punsubscribe'),
    message: Buffer.from('pmessage')
  },
  [PUBSUB_TYPE.SHARDED]: {
    subscribe: Buffer.from('ssubscribe'),
    unsubscribe: Buffer.from('sunsubscribe'),
    message: Buffer.from('smessage')
  }
};

export type PubSubListener<
  RETURN_BUFFERS extends boolean = false
> = <T extends RETURN_BUFFERS extends true ? Buffer : string>(message: T, channel: T) => unknown;

export interface ChannelListeners {
  unsubscribing: boolean;
  buffers: Set<PubSubListener<true>>;
  strings: Set<PubSubListener<false>>;
}

export type PubSubTypeListeners = Map<string, ChannelListeners>;

export type PubSubListeners = Record<PubSubType, PubSubTypeListeners>;

export type PubSubCommand = (
  Required<Pick<CommandToWrite, 'args' | 'channelsCounter' | 'resolve'>> & {
    reject: undefined | (() => unknown);
    /**
     * True when a teardown carried this command's intent to another client
     * (multi-db move): the wire rejection is then a SUCCESS for the caller —
     * the subscription change lives on, on the adopting member.
     */
    carried?: () => boolean;
  }
);

export class PubSub {
  readonly #clientId: string;

  constructor(clientId: string) {
    this.#clientId = clientId;
  }

  static isStatusReply(reply: Array<Buffer>): boolean {
    const firstElement = typeof reply[0] === 'string' ? Buffer.from(reply[0]) : reply[0];
    return (
      COMMANDS[PUBSUB_TYPE.CHANNELS].subscribe.equals(firstElement) ||
      COMMANDS[PUBSUB_TYPE.CHANNELS].unsubscribe.equals(firstElement) ||
      COMMANDS[PUBSUB_TYPE.PATTERNS].subscribe.equals(firstElement) ||
      COMMANDS[PUBSUB_TYPE.PATTERNS].unsubscribe.equals(firstElement) ||
      COMMANDS[PUBSUB_TYPE.SHARDED].subscribe.equals(firstElement)
    );
  }

  static isShardedUnsubscribe(reply: Array<Buffer>): boolean {
    const firstElement = typeof reply[0] === 'string' ? Buffer.from(reply[0]) : reply[0];
    return COMMANDS[PUBSUB_TYPE.SHARDED].unsubscribe.equals(firstElement);
  }

  // The count Redis reports on an UNSUBSCRIBE/PUNSUBSCRIBE reply is the total of the
  // remaining channel + pattern subscriptions (sharded channels are counted separately).
  // An argument-less UNSUBSCRIBE therefore does not drive that count to 0 while pattern
  // subscriptions remain (and vice versa), so completion is reached when only the other
  // type's subscriptions are left, not at 0.
  residualAfterUnsubscribeAll(reply: Array<Buffer>): number {
    const firstElement = typeof reply[0] === 'string' ? Buffer.from(reply[0]) : reply[0];
    if (COMMANDS[PUBSUB_TYPE.PATTERNS].unsubscribe.equals(firstElement)) {
      return this.listeners[PUBSUB_TYPE.CHANNELS].size;
    }
    if (COMMANDS[PUBSUB_TYPE.CHANNELS].unsubscribe.equals(firstElement)) {
      return this.listeners[PUBSUB_TYPE.PATTERNS].size;
    }
    // sharded: Redis tracks its counter independently, so it does reach 0
    return 0;
  }

  static #channelsArray(channels: string | Array<string>) {
    return (Array.isArray(channels) ? channels : [channels]);
  }

  static #listenersSet<T extends boolean>(
    listeners: ChannelListeners,
    returnBuffers?: T
  ) {
    return (returnBuffers ? listeners.buffers : listeners.strings);
  }

  #subscribing = 0;

  /**
   * Subscribes and unsubscribes whose wire reply is still in flight, in
   * issuance order. Until the reply lands, a subscribe's listeners exist only
   * in its command closure, and an unsubscribe's channels are still in
   * `listeners` — so a subscription move started mid-round-trip would drop the
   * first and resurrect the second. {@link removeAllListeners} replays the log
   * onto its snapshot in order (an unsubscribe then a re-subscribe of the same
   * channel must end subscribed) and marks each op carried: the late confirm
   * then becomes a no-op on the demoted client, and the late rejection a
   * caller-visible success.
   */
  readonly #pendingOps = new Set<{
    applyTo: (listeners: PubSubListeners) => void;
    carried: boolean;
  }>();

  #isActive = false;

  get isActive() {
    return this.#isActive;
  }

  readonly listeners: PubSubListeners = {
    [PUBSUB_TYPE.CHANNELS]: new Map(),
    [PUBSUB_TYPE.PATTERNS]: new Map(),
    [PUBSUB_TYPE.SHARDED]: new Map()
  };

  subscribe<T extends boolean>(
    type: PubSubType,
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    returnBuffers?: T
  ) {
    const args: Array<RedisArgument> = [COMMANDS[type].subscribe],
      channelsArray = PubSub.#channelsArray(channels),
      newChannels: Array<string> = [];
    for (const channel of channelsArray) {
      const channelListeners = this.listeners[type].get(channel);
      if (!channelListeners || channelListeners.unsubscribing) {
        args.push(channel);
        newChannels.push(channel);
      } else {
        PubSub.#listenersSet(channelListeners, returnBuffers).add(listener);
      }
    }

    if (args.length === 1) {
      // all channels are already subscribed, listeners added above
      return;
    }

    this.#isActive = true;
    this.#subscribing++;
    const pending = {
      // the listener Sets dedupe one that also reached the live maps
      applyTo: (snapshot: PubSubListeners) => {
        for (const channel of channelsArray) {
          let channelListeners = snapshot[type].get(channel);
          if (!channelListeners) {
            channelListeners = { unsubscribing: false, buffers: new Set(), strings: new Set() };
            snapshot[type].set(channel, channelListeners);
          }
          PubSub.#listenersSet(channelListeners, returnBuffers).add(listener);
        }
      },
      carried: false
    };
    this.#pendingOps.add(pending);
    return {
      args,
      channelsCounter: args.length - 1,
      resolve: () => {
        this.#subscribing--;
        this.#pendingOps.delete(pending);
        if (pending.carried) {
          // a move already took this intent to another member — registering
          // here would resurrect the subscription on the demoted client
          this.#updateIsActive();
          return;
        }
        for (const channel of newChannels) {
          let listeners = this.listeners[type].get(channel);
          if (!listeners) {
            listeners = {
              unsubscribing: false,
              buffers: new Set(),
              strings: new Set()
            };
            this.listeners[type].set(channel, listeners);
          }
          PubSub.#listenersSet(listeners, returnBuffers).add(listener);
        }
      },
      reject: () => {
        this.#subscribing--;
        this.#pendingOps.delete(pending);
        this.#updateIsActive();
      },
      carried: () => pending.carried
    } satisfies PubSubCommand;
  }

  extendChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    if (!this.#extendChannelListeners(type, channel, listeners)) return;

    this.#isActive = true;
    this.#subscribing++;
    return {
      args: [
        COMMANDS[type].subscribe,
        channel
      ],
      channelsCounter: 1,
      resolve: () => this.#subscribing--,
      reject: () => {
        this.#subscribing--;
        this.#updateIsActive();
      }
    } satisfies PubSubCommand;
  }

  #extendChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners
  ) {
    const existingListeners = this.listeners[type].get(channel);
    if (!existingListeners) {
      this.listeners[type].set(channel, listeners);
      return true;
    }

    for (const listener of listeners.buffers) {
      existingListeners.buffers.add(listener);
    }

    for (const listener of listeners.strings) {
      existingListeners.strings.add(listener);
    }

    return false;
  }

  extendTypeListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    const args: Array<RedisArgument> = [COMMANDS[type].subscribe];
    for (const [channel, channelListeners] of listeners) {
      if (this.#extendChannelListeners(type, channel, channelListeners)) {
        args.push(channel);
      }
    }

    if (args.length === 1) return;

    this.#isActive = true;
    this.#subscribing++;
    return {
      args,
      channelsCounter: args.length - 1,
      resolve: () => this.#subscribing--,
      reject: () => {
        this.#subscribing--;
        this.#updateIsActive();
      }
    } satisfies PubSubCommand;
  }

  unsubscribe<T extends boolean>(
    type: PubSubType,
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    returnBuffers?: T
  ) {
    const listeners = this.listeners[type];
    // flag what the reply will delete, so a re-subscribe before the reply
    // lands sends SUBSCRIBE instead of joining an entry about to go away
    if (!channels) {
      for (const sets of listeners.values()) sets.unsubscribing = true;
      return this.#unsubscribeCommand(
        type,
        [COMMANDS[type].unsubscribe],
        // cannot use `this.#subscribed` because there might be some `SUBSCRIBE` commands in the queue
        // cannot use `this.#subscribed + this.#subscribing` because some `SUBSCRIBE` commands might fail
        NaN,
        listeners => listeners.clear()
      );
    }

    const channelsArray = PubSub.#channelsArray(channels);
    if (!listener) {
      for (const channel of channelsArray) {
        const sets = listeners.get(channel);
        if (sets) sets.unsubscribing = true;
      }
      return this.#unsubscribeCommand(
        type,
        [COMMANDS[type].unsubscribe, ...channelsArray],
        channelsArray.length,
        listeners => {
          for (const channel of channelsArray) {
            listeners.delete(channel);
          }
        }
      );
    }

    const args: Array<RedisArgument> = [COMMANDS[type].unsubscribe];
    for (const channel of channelsArray) {
      const sets = listeners.get(channel);
      if (sets) {
        let current,
          other;
        if (returnBuffers) {
          current = sets.buffers;
          other = sets.strings;
        } else {
          current = sets.strings;
          other = sets.buffers;
        }

        const currentSize = current.has(listener) ? current.size - 1 : current.size;
        if (currentSize !== 0 || other.size !== 0) continue;
        sets.unsubscribing = true;
      }

      args.push(channel);
    }

    if (args.length === 1) {
      // all channels has other listeners,
      // delete the listeners without issuing a command
      for (const channel of channelsArray) {
        PubSub.#listenersSet(
          listeners.get(channel)!,
          returnBuffers
        ).delete(listener);
      }
      return;
    }

    return this.#unsubscribeCommand(
      type,
      args,
      args.length - 1,
      listeners => {
        for (const channel of channelsArray) {
          const sets = listeners.get(channel);
          if (!sets) continue;

          (returnBuffers ? sets.buffers : sets.strings).delete(listener);
          if (sets.buffers.size === 0 && sets.strings.size === 0) {
            listeners.delete(channel);
          }
        }
      }
    );
  }

  #unsubscribeCommand(
    type: PubSubType,
    args: Array<RedisArgument>,
    channelsCounter: number,
    removeListeners: (listeners: PubSubTypeListeners) => void
  ) {
    const pending = {
      applyTo: (snapshot: PubSubListeners) => removeListeners(snapshot[type]),
      carried: false
    };
    this.#pendingOps.add(pending);
    return {
      args,
      channelsCounter,
      resolve: () => {
        this.#pendingOps.delete(pending);
        // a move already applied this removal to the extracted snapshot —
        // the live maps are fresh, nothing left to remove here
        if (!pending.carried) removeListeners(this.listeners[type]);
        this.#updateIsActive();
      },
      reject: () => {
        // the unsubscribe failed (socket drop / error reply): the channel
        // legitimately stays subscribed, so drop the pending entry WITHOUT
        // applying its removal — otherwise a later removeAllListeners would
        // replay this stale removal and drop a still-live subscription
        this.#pendingOps.delete(pending);
        this.#updateIsActive();
      },
      // a carried removal took effect on the snapshot, so the teardown's
      // rejection of the wire command is a success for the caller
      carried: () => pending.carried
    } satisfies PubSubCommand;
  }

  #updateIsActive() {
    this.#isActive = (
      this.listeners[PUBSUB_TYPE.CHANNELS].size !== 0 ||
      this.listeners[PUBSUB_TYPE.PATTERNS].size !== 0 ||
      this.listeners[PUBSUB_TYPE.SHARDED].size !== 0 ||
      this.#subscribing !== 0
    );
  }

  reset() {
    this.#isActive = false;
    this.#subscribing = 0;
  }

  resubscribe() {
    const commands: PubSubCommand[] = [];
    for (const [type, listeners] of Object.entries(this.listeners)) {
      if (!listeners.size) continue;

      this.#isActive = true;

      if(type === PUBSUB_TYPE.SHARDED) {
        this.#shardedResubscribe(commands, listeners);
      } else {
        this.#normalResubscribe(commands, type, listeners);
      }
    }

    return commands;
  }

  #normalResubscribe(commands: PubSubCommand[], type: string, listeners: PubSubTypeListeners) {
    this.#subscribing++;
    const callback = () => { if (this.#subscribing > 0) this.#subscribing--; };
    commands.push({
      args: [
        COMMANDS[type as PubSubType].subscribe,
        ...listeners.keys()
      ],
      channelsCounter: listeners.size,
      resolve: callback,
      reject: callback
    });
  }

  #shardedResubscribe(commands: PubSubCommand[], listeners: PubSubTypeListeners) {
    const callback = () => { if (this.#subscribing > 0) this.#subscribing--; };
    for(const channel of listeners.keys()) {
      this.#subscribing++;
      commands.push({
        args: [
          COMMANDS[PUBSUB_TYPE.SHARDED].subscribe,
          channel
        ],
        channelsCounter: 1,
        resolve: callback,
        reject: callback
      })
    }
  }

  handleMessageReply(reply: Array<Buffer>): boolean {
    const firstElement = typeof reply[0] === 'string' ? Buffer.from(reply[0]) : reply[0];
    if (COMMANDS[PUBSUB_TYPE.CHANNELS].message.equals(firstElement)) {
      this.#emitPubSubMessage(
        PUBSUB_TYPE.CHANNELS,
        reply[2],
        reply[1]
      );
      return true;
    } else if (COMMANDS[PUBSUB_TYPE.PATTERNS].message.equals(firstElement)) {
      this.#emitPubSubMessage(
        PUBSUB_TYPE.PATTERNS,
        reply[3],
        reply[2],
        reply[1]
      );
      return true;
    } else if (COMMANDS[PUBSUB_TYPE.SHARDED].message.equals(firstElement)) {
      this.#emitPubSubMessage(
        PUBSUB_TYPE.SHARDED,
        reply[2],
        reply[1]
      );
      return true;
    }

    return false;
  }

  removeShardedListeners(channel: string): ChannelListeners {
    const listeners = this.listeners[PUBSUB_TYPE.SHARDED].get(channel)!;
    this.listeners[PUBSUB_TYPE.SHARDED].delete(channel);
    this.#updateIsActive();
    return listeners;
  }

  removeAllListeners() {
    const result = {
      [PUBSUB_TYPE.CHANNELS]: this.listeners[PUBSUB_TYPE.CHANNELS],
      [PUBSUB_TYPE.PATTERNS]: this.listeners[PUBSUB_TYPE.PATTERNS],
      [PUBSUB_TYPE.SHARDED]: this.listeners[PUBSUB_TYPE.SHARDED]
    }

    // replay in-flight ops in issuance order — see #pendingOps. The move
    // consumes the log: a late settle must not replay into a later move.
    for (const pending of this.#pendingOps) {
      pending.carried = true;
      pending.applyTo(result);
    }
    this.#pendingOps.clear();

    // the adopting client sends a fresh SUBSCRIBE for every moved channel; a
    // stale flag from a failed unsubscribe would make it re-subscribe later
    for (const typeListeners of Object.values(result)) {
      for (const channelListeners of typeListeners.values()) {
        channelListeners.unsubscribing = false;
      }
    }

    this.listeners[PUBSUB_TYPE.CHANNELS] = new Map();
    this.listeners[PUBSUB_TYPE.PATTERNS] = new Map();
    this.listeners[PUBSUB_TYPE.SHARDED] = new Map();

    // after the reset — `result` aliases the old maps, so updating first would
    // still see them as populated and leave `isActive` stuck on true
    this.#updateIsActive();

    return result;
  }

  removeShardedPubSubListenersForSlots(slots: Set<number>) {
    const sharded = new Map<string, ChannelListeners>();
    for (const [chanel, value] of this.listeners[PUBSUB_TYPE.SHARDED]) {
      if (slots.has(calculateSlot(chanel))) {
        sharded.set(chanel, value);
        this.listeners[PUBSUB_TYPE.SHARDED].delete(chanel);
      }
    }

    this.#updateIsActive();

    return {
      [PUBSUB_TYPE.SHARDED]: sharded
    };
  }

  #emitPubSubMessage(
    type: PubSubType,
    message: Buffer,
    channel: Buffer,
    pattern?: Buffer
  ): void {
    const keyString = (pattern ?? channel).toString(),
      listeners = this.listeners[type].get(keyString);

    if (!listeners) return;

    publish(CHANNELS.PUBSUB, () => ({
      direction: 'in' as const,
      clientId: this.#clientId,
      channel,
      sharded: type === PUBSUB_TYPE.SHARDED,
    }));

    for (const listener of listeners.buffers) {
      listener(message, channel);
    }

    if (!listeners.strings.size) return;

    const channelString = pattern ? channel.toString() : keyString,
      messageString = channelString === '__redis__:invalidate' ?
        // https://github.com/redis/redis/pull/7469
        // https://github.com/redis/redis/issues/7463
        (message === null ? null : (message as unknown as Array<Buffer>).map(x => x.toString())) as unknown as string :
        message.toString();
    for (const listener of listeners.strings) {
      listener(messageString, channelString);
    }
  }
}
