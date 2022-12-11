import { rejects } from "assert";
import { RedisCommandArgument } from "../commands";
import { pushVerdictArguments } from "../commands/generic-transformers";
import { CommandWaitingToBeSent } from "./commands-queue";

export enum PubSubTypes {
    CHANNELS = 'CHANNELS',
    PATTERNS = 'PATTERNS',
    SHARDED = 'SHARDED'
}

const COMMANDS = {
    [PubSubTypes.CHANNELS]: {
        subscribe: Buffer.from('subscribe'),
        unsubscribe: Buffer.from('unsubscribe'),
        message: Buffer.from('message')
    },
    [PubSubTypes.PATTERNS]: {
        subscribe: Buffer.from('psubscribe'),
        unsubscribe: Buffer.from('punsubscribe'),
        message: Buffer.from('pmessage')
    },
    [PubSubTypes.SHARDED]: {
        subscribe: Buffer.from('ssubscribe'),
        unsubscribe: Buffer.from('sunsubscribe'),
        message: Buffer.from('smessage')
    }
};

export type PubSubListener<
    RETURN_BUFFERS extends boolean = false
> = <T extends RETURN_BUFFERS extends true ? Buffer : string>(message: T, channel: T) => unknown;

interface Listeners {
    buffers: Set<PubSubListener<true>>;
    strings: Set<PubSubListener<false>>;
}

type ListenersMap = Map<string, Listeners>;

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

    isActive = false;

    #listeners = {
        [PubSubTypes.CHANNELS]: new Map() as ListenersMap,
        [PubSubTypes.PATTERNS]: new Map() as ListenersMap,
        [PubSubTypes.SHARDED]: new Map() as ListenersMap
    };

    subscribe<T extends boolean>(
        type: PubSubTypes,
        channels: string | Array<string>,
        listener: PubSubListener<T>,
        returnBuffers?: T
    ): PubSubCommand | undefined {
        const args: [Buffer, ...Array<string>] = [COMMANDS[type].subscribe],
            listenersMap = this.#listeners[type],
            channelsArray = (Array.isArray(channels) ? channels : [channels]);
        for (const channel of channelsArray) {
            if (!listenersMap.has(channel)) args.push(channel);
        }

        if (args.length === 1) return;

        this.isActive = true;
        this.#subscribing++;
        return {
            args,
            channelsCounter: args.length - 1,
            fulfilled: () => this.#subscribing--,
            resolve: () => {
                for (const channel of channelsArray) {
                    let listeners = listenersMap.get(channel);
                    if (!listeners) {
                        listeners = {
                            buffers: new Set(),
                            strings: new Set()
                        };
                        listenersMap.set(channel, listeners);
                    };

                    (returnBuffers ? listeners.buffers : listeners.strings).add(listener);
                }
            },
            reject: () => this.#updateIsActive()
        };
    }
    
    unsubscribe<T extends boolean>(
        type: PubSubTypes,
        channels?: string | Array<string>,
        listener?: PubSubListener<T>,
        returnBuffers?: T
    ): PubSubCommand | undefined {
        const listeners = this.#listeners[type];
        if (!channels) {
            return this.#unsubscribeCommand(
                [COMMANDS[type].unsubscribe],
                this.#subscribed,
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
            }

            args.push(channel);
        }

        if (args.length === 1) {
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
            const args = [
                COMMANDS[type as PubSubTypes].subscribe,
                ...listeners.keys()
            ];
            commands.push({
                args,
                channelsCounter: args.length - 1,
                fulfilled: () => this.#subscribing--
            });
        }

        return commands;
    }

    handleMessageReply(reply: Array<Buffer>): boolean {
        if (COMMANDS[PubSubTypes.CHANNELS].message.equals(reply[0])) {
            this.#emitPubSubMessage(
                PubSubTypes.CHANNELS,
                reply[2],
                reply[1]
            );
            return true;
        } else if (COMMANDS[PubSubTypes.PATTERNS].message.equals(reply[0])) {
            this.#emitPubSubMessage(
                PubSubTypes.PATTERNS,
                reply[3],
                reply[2],
                reply[1]
            );
            return true;
        } else if (COMMANDS[PubSubTypes.SHARDED].message.equals(reply[0])) {
            this.#emitPubSubMessage(
                PubSubTypes.SHARDED,
                reply[2],
                reply[1]
            );
            return true;
        }

        return false;
    }

    handleStatusReply(reply: Array<Buffer>): boolean {
        if (
            COMMANDS[PubSubTypes.CHANNELS].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubTypes.CHANNELS].unsubscribe.equals(reply[0]) ||
            COMMANDS[PubSubTypes.PATTERNS].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubTypes.PATTERNS].unsubscribe.equals(reply[0]) ||
            COMMANDS[PubSubTypes.SHARDED].subscribe.equals(reply[0]) ||
            COMMANDS[PubSubTypes.SHARDED].unsubscribe.equals(reply[0])
        ) {
            this.#subscribed = reply[2] as unknown as number;
            this.#updateIsActive();
            return true;
        }

        return false;
    }

    #emitPubSubMessage(
        type: PubSubTypes,
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
}
