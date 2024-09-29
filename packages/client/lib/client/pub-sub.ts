import { RedisCommandArgument } from "../commands";

export enum PubSubType {
    CHANNELS = 'CHANNELS',
    PATTERNS = 'PATTERNS',
    SHARDED = 'SHARDED'
}

const COMMANDS = {
    [PubSubType.CHANNELS]: {
        subscribe: Buffer.from('subscribe'),
        unsubscribe: Buffer.from('unsubscribe'),
        message: Buffer.from('message')
    },
    [PubSubType.PATTERNS]: {
        subscribe: Buffer.from('psubscribe'),
        unsubscribe: Buffer.from('punsubscribe'),
        message: Buffer.from('pmessage')
    },
    [PubSubType.SHARDED]: {
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

type Listeners = Record<PubSubType, PubSubTypeListeners>;

export type PubSubCommand = ReturnType<
    typeof PubSub.prototype.subscribe |
    typeof PubSub.prototype.unsubscribe | 
    typeof PubSub.prototype.extendTypeListeners
>;

export class PubSub {
    static isStatusReply(reply: Array<Buffer>): boolean {
        return (
            COMMANDS[PubSubType.CHANNELS].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.CHANNELS].unsubscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.PATTERNS].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.PATTERNS].unsubscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.SHARDED].subscribe.equals(reply[0])
        );
    }

    static isShardedUnsubscribe(reply: Array<Buffer>): boolean {
        return COMMANDS[PubSubType.SHARDED].unsubscribe.equals(reply[0]);
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

    #isActive = false;

    get isActive() {
        return this.#isActive;
    }

    #listeners: Listeners = {
        [PubSubType.CHANNELS]: new Map(),
        [PubSubType.PATTERNS]: new Map(),
        [PubSubType.SHARDED]: new Map()
    };

    subscribe<T extends boolean>(
        type: PubSubType,
        channels: string | Array<string>,
        listener: PubSubListener<T>,
        returnBuffers?: T
    ) {
        const args: Array<RedisCommandArgument> = [COMMANDS[type].subscribe],
            channelsArray = PubSub.#channelsArray(channels);
        for (const channel of channelsArray) {
            let channelListeners = this.#listeners[type].get(channel);
            if (!channelListeners || channelListeners.unsubscribing) {
                args.push(channel);
            }
        }

        if (args.length === 1) {
            // all channels are already subscribed, add listeners without issuing a command
            for (const channel of channelsArray) {
                PubSub.#listenersSet(
                    this.#listeners[type].get(channel)!,
                    returnBuffers
                ).add(listener);
            }
            return;
        }

        this.#isActive = true;
        this.#subscribing++;
        return {
            args,
            channelsCounter: args.length - 1,
            resolve: () => {
                this.#subscribing--;
                for (const channel of channelsArray) {
                    let listeners = this.#listeners[type].get(channel);
                    if (!listeners) {
                        listeners = {
                            unsubscribing: false,
                            buffers: new Set(),
                            strings: new Set()
                        };
                        this.#listeners[type].set(channel, listeners);
                    }

                    PubSub.#listenersSet(listeners, returnBuffers).add(listener);
                }
            },
            reject: () => {
                this.#subscribing--;
                this.#updateIsActive();
            }
        };
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
        };
    }

    #extendChannelListeners(
        type: PubSubType,
        channel: string,
        listeners: ChannelListeners
    ) {
        const existingListeners = this.#listeners[type].get(channel);
        if (!existingListeners) {
            this.#listeners[type].set(channel, listeners);
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
        const args: Array<RedisCommandArgument> = [COMMANDS[type].subscribe];
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
        };
    }

    unsubscribe<T extends boolean>(
        type: PubSubType,
        channels?: string | Array<string>,
        listener?: PubSubListener<T>,
        returnBuffers?: T
    ) {
        const listeners = this.#listeners[type];
        if (!channels) {
            return this.#unsubscribeCommand(
                [COMMANDS[type].unsubscribe],
                // cannot use `this.#subscribed` because there might be some `SUBSCRIBE` commands in the queue
                // cannot use `this.#subscribed + this.#subscribing` because some `SUBSCRIBE` commands might fail
                NaN,
                () => listeners.clear()
            );
        }

        const channelsArray = PubSub.#channelsArray(channels);
        if (!listener) {
            return this.#unsubscribeCommand(
                [COMMANDS[type].unsubscribe, ...channelsArray],
                channelsArray.length,
                () => {
                    for (const channel of channelsArray) {
                        listeners.delete(channel);
                    }
                }
            );
        }

        const args: Array<RedisCommandArgument> = [COMMANDS[type].unsubscribe];
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
            args,
            args.length - 1,
            () => {
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
        args: Array<RedisCommandArgument>,
        channelsCounter: number,
        removeListeners: () => void
    ) {
        return {
            args,
            channelsCounter,
            resolve: () => {
                removeListeners();
                this.#updateIsActive();
            },
            reject: undefined // use the same structure as `subscribe`
        };
    }

    #updateIsActive() {
        this.#isActive = (
            this.#listeners[PubSubType.CHANNELS].size !== 0 ||
            this.#listeners[PubSubType.PATTERNS].size !== 0 ||
            this.#listeners[PubSubType.SHARDED].size !== 0 ||
            this.#subscribing !== 0
        );
    }

    reset() {
        this.#isActive = false;
        this.#subscribing = 0;
    }

    resubscribe(): Array<PubSubCommand> {
        const commands = [];
        for (const [type, listeners] of Object.entries(this.#listeners)) {
            if (!listeners.size) continue;

            this.#isActive = true;
            this.#subscribing++;
            const callback = () => this.#subscribing--;
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

        return commands;
    }

    handleMessageReply(reply: Array<Buffer>): boolean {
        if (COMMANDS[PubSubType.CHANNELS].message.equals(reply[0])) {
            this.#emitPubSubMessage(
                PubSubType.CHANNELS,
                reply[2],
                reply[1]
            );
            return true;
        } else if (COMMANDS[PubSubType.PATTERNS].message.equals(reply[0])) {
            this.#emitPubSubMessage(
                PubSubType.PATTERNS,
                reply[3],
                reply[2],
                reply[1]
            );
            return true;
        } else if (COMMANDS[PubSubType.SHARDED].message.equals(reply[0])) {
            this.#emitPubSubMessage(
                PubSubType.SHARDED,
                reply[2],
                reply[1]
            );
            return true;
        }

        return false;
    }

    removeShardedListeners(channel: string): ChannelListeners {
        const listeners = this.#listeners[PubSubType.SHARDED].get(channel)!;
        this.#listeners[PubSubType.SHARDED].delete(channel);
        this.#updateIsActive();
        return listeners;
    }
    
    #emitPubSubMessage(
        type: PubSubType,
        message: Buffer,
        channel: Buffer,
        pattern?: Buffer
    ): void {
        const keyString = (pattern ?? channel).toString(),
            listeners = this.#listeners[type].get(keyString);

        if (!listeners) return;

        for (const listener of listeners.buffers) {
            listener(message, channel);
        }

        if (!listeners.strings.size) return;

        const channelString = pattern ? channel.toString() : keyString,
            messageString = channelString === '__redis__:invalidate' ?
                // https://github.com/redis/redis/pull/7469
                // https://github.com/redis/redis/issues/7463
                (message === null ? null : (message as any as Array<Buffer>).map(x => x.toString())) as any :
                message.toString();
        for (const listener of listeners.strings) {
            listener(messageString, channelString);
        }
    }

    getTypeListeners(type: PubSubType): PubSubTypeListeners {
        return this.#listeners[type];
    }
}
