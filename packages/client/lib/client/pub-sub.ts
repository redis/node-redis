import { rejects } from "assert";
import { RedisCommandArgument } from "../commands";
import { pushVerdictArguments } from "../commands/generic-transformers";
import { CommandWaitingToBeSent } from "./commands-queue";

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

enum ChannelListenersState {
    SUBSCRIBING,
    UNSUBSCRIBING,
    SUBSCRIBED
}

interface ChannelListeners {
    state: ChannelListenersState;
    buffers: Set<PubSubListener<true>>;
    strings: Set<PubSubListener<false>>;

}

type Listeners = Record<PubSubType, Map<string, ChannelListeners>>;

export interface PubSubCommand {
    args: Array<RedisCommandArgument>;
    channelsCounter: number;
    fulfilled(): void;
    resolve?(): void;
    reject?(): void;
};

export class PubSub {
    #subscribing = 0;
    #subscribed = 0;
    #unsubscribing = 0;

    get subscribed () {
        return this.#subscribed;
    }

    isActive = false;

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
    ): PubSubCommand | undefined {
        const args: Array<RedisCommandArgument> = [COMMANDS[type].subscribe],
            channelsArray = (Array.isArray(channels) ? channels : [channels]);
        for (const channel of channelsArray) {
            let channelListeners = this.#listeners[type].get(channel);
            if (!channelListeners) {
                this.#listeners[type].set(channel, {
                    state: ChannelListenersState.SUBSCRIBING,
                    buffers: new Set(),
                    strings: new Set()
                });
                args.push(channel);
            } else if (channelListeners.state === ChannelListenersState.UNSUBSCRIBING) {
                channelListeners.state = ChannelListenersState.SUBSCRIBING;
                args.push(channel);
            }
        }

        if (args.length === 1) {
            // all channels are already subscribed or subscribing,
            // add listeners without issueing a command
            for (const channel of channelsArray) {
                const listeners = this.#listeners[type].get(channel)!;
                (returnBuffers ? listeners.buffers : listeners.strings).add(listener);
            }
            return;
        }

        this.isActive = true;
        this.#subscribing++;
        return {
            args,
            channelsCounter: args.length - 1,
            fulfilled: () => this.#subscribing--,
            resolve: () => {
                for (const channel of channelsArray) {
                    let listeners = this.#listeners[type].get(channel);
                    if (listeners) {
                        listeners.state = ChannelListenersState.SUBSCRIBED;
                    } else {
                        listeners = {
                            state: ChannelListenersState.SUBSCRIBED,
                            buffers: new Set(),
                            strings: new Set()
                        };
                        this.#listeners[type].set(channel, listeners);
                    }

                    (returnBuffers ? listeners.buffers : listeners.strings).add(listener);
                }
            },
            reject: () => this.#updateIsActive()
        };
    }
    
    unsubscribe<T extends boolean>(
        type: PubSubType,
        channels?: string | Array<string>,
        listener?: PubSubListener<T>,
        returnBuffers?: T
    ): PubSubCommand | undefined {
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

        const channelsArray = (Array.isArray(channels) ? channels : [channels]);
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
                sets.state = ChannelListenersState.UNSUBSCRIBING;
            }

            args.push(channel);
        }

        if (args.length === 1) {
            // all channels has other listeners,
            // delete the listeners without issuing a command
            for (const channel of channelsArray) {
                const sets = listeners.get(channel)!;
                (returnBuffers ? sets.buffers : sets.strings).delete(listener);
            }
            return;
        }

        return this.#unsubscribeCommand(
            args,
            channels.length,
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
    ): PubSubCommand {
        this.#unsubscribing++;
        return {
            args,
            channelsCounter,
            fulfilled: () => this.#unsubscribing--,
            resolve: () => {
                removeListeners();
                this.#updateIsActive();
            }
        };
    }

    #updateIsActive() {
        this.isActive = (
            this.#subscribed !== 0 ||
            this.#subscribing !== 0 ||
            this.#unsubscribing !== 0
        );
    }

    resubscribe(): Array<PubSubCommand> {
        this.#subscribing = this.#subscribed = this.#unsubscribing = 0;

        const commands = [];
        for (const [type, listeners] of Object.entries(this.#listeners)) {
            if (!listeners.size) continue;

            this.isActive = true;
            this.#subscribing++;
            commands.push({
                args: [
                    COMMANDS[type as PubSubType].subscribe,
                    ...listeners.keys()
                ],
                channelsCounter: listeners.size,
                fulfilled: () => this.#subscribing--
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

    handleStatusReply(reply: Array<Buffer>): boolean {
        if (
            COMMANDS[PubSubType.CHANNELS].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.CHANNELS].unsubscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.PATTERNS].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.PATTERNS].unsubscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.SHARDED].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubType.SHARDED].unsubscribe.equals(reply[0])
        ) {
            this.#subscribed = reply[2] as unknown as number;
            this.#updateIsActive();
            return true;
        }

        return false;
    }
}
