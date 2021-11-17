import * as LinkedList from 'yallist';
import { AbortError } from '../errors';
import { RedisCommandArguments, RedisCommandRawReply } from '../commands';

// We need to use 'require', because it's not possible with Typescript to import
// classes that are exported as 'module.exports = class`, without esModuleInterop
// set to true.
const RedisParser = require('redis-parser');

export interface QueueCommandOptions {
    asap?: boolean;
    chainId?: symbol;
    signal?: AbortSignal;
}

interface CommandWaitingToBeSent extends CommandWaitingForReply {
    args: RedisCommandArguments;
    chainId?: symbol;
    abort?: {
        signal: AbortSignal;
        listener(): void;
    };
}

interface CommandWaitingForReply {
    resolve(reply?: unknown): void;
    reject(err: Error): void;
    channelsCounter?: number;
    bufferMode?: boolean;
}

export enum PubSubSubscribeCommands {
    SUBSCRIBE = 'SUBSCRIBE',
    PSUBSCRIBE = 'PSUBSCRIBE'
}

export enum PubSubUnsubscribeCommands {
    UNSUBSCRIBE = 'UNSUBSCRIBE',
    PUNSUBSCRIBE = 'PUNSUBSCRIBE'
}

type PubSubArgumentTypes = Buffer | string;

export type PubSubListener<
    BUFFER_MODE extends boolean = false,
    T = BUFFER_MODE extends true ? Buffer : string
> = (message: T, channel: T) => unknown;

interface PubSubListeners {
    buffers: Set<PubSubListener<true>>;
    strings: Set<PubSubListener<false>>;
}

type PubSubListenersMap = Map<string, PubSubListeners>;

interface PubSubState {
    subscribing: number;
    subscribed: number;
    unsubscribing: number;
    listeners: {
        channels: PubSubListenersMap;
        patterns: PubSubListenersMap;
    };
}

export default class RedisCommandsQueue {
    static #flushQueue<T extends CommandWaitingForReply>(queue: LinkedList<T>, err: Error): void {
        while (queue.length) {
            queue.shift()!.reject(err);
        }
    }

    static #emitPubSubMessage(listenersMap: PubSubListenersMap, message: Buffer, channel: Buffer, pattern?: Buffer): void {
        const keyString = (pattern || channel).toString(),
            listeners = listenersMap.get(keyString)!;
        for (const listener of listeners.buffers) {
            listener(message, channel);
        }

        if (!listeners.strings.size) return;

        const messageString = message.toString(),
            channelString = pattern ? channel.toString() : keyString;
        for (const listener of listeners.strings) {
            listener(messageString, channelString);
        }
    }

    readonly #maxLength: number | null | undefined;

    readonly #waitingToBeSent = new LinkedList<CommandWaitingToBeSent>();

    readonly #waitingForReply = new LinkedList<CommandWaitingForReply>();

    #pubSubState: PubSubState | undefined;

    static readonly #PUB_SUB_MESSAGES = {
        message: Buffer.from('message'),
        pMessage: Buffer.from('pmessage'),
        subscribe: Buffer.from('subscribe'),
        pSubscribe: Buffer.from('psubscribe'),
        unsubscribe: Buffer.from('unsunscribe'),
        pUnsubscribe: Buffer.from('punsubscribe')
    };

    readonly #parser = new RedisParser({
        returnReply: (reply: unknown) => {
            if (this.#pubSubState && Array.isArray(reply)) {
                if (RedisCommandsQueue.#PUB_SUB_MESSAGES.message.equals(reply[0])) {
                    return RedisCommandsQueue.#emitPubSubMessage(
                        this.#pubSubState.listeners.channels,
                        reply[2],
                        reply[1]
                    );
                } else if (RedisCommandsQueue.#PUB_SUB_MESSAGES.pMessage.equals(reply[0])) {
                    return RedisCommandsQueue.#emitPubSubMessage(
                        this.#pubSubState.listeners.patterns,
                        reply[3],
                        reply[2],
                        reply[1]
                    );
                } else if (
                    RedisCommandsQueue.#PUB_SUB_MESSAGES.subscribe.equals(reply[0]) ||
                    RedisCommandsQueue.#PUB_SUB_MESSAGES.pSubscribe.equals(reply[0]) ||
                    RedisCommandsQueue.#PUB_SUB_MESSAGES.unsubscribe.equals(reply[0]) ||
                    RedisCommandsQueue.#PUB_SUB_MESSAGES.pUnsubscribe.equals(reply[0])
                ) {
                    if (--this.#waitingForReply.head!.value.channelsCounter! === 0) {
                        this.#shiftWaitingForReply().resolve();
                    }
                    return;
                }
            }

            this.#shiftWaitingForReply().resolve(reply);
        },
        returnError: (err: Error) => this.#shiftWaitingForReply().reject(err)
    });

    #chainInExecution: symbol | undefined;

    constructor(maxLength: number | null | undefined) {
        this.#maxLength = maxLength;
    }

    addCommand<T = RedisCommandRawReply>(args: RedisCommandArguments, options?: QueueCommandOptions, bufferMode?: boolean): Promise<T> {
        if (this.#pubSubState) {
            return Promise.reject(new Error('Cannot send commands in PubSub mode'));
        } else if (this.#maxLength && this.#waitingToBeSent.length + this.#waitingForReply.length >= this.#maxLength) {
            return Promise.reject(new Error('The queue is full'));
        } else if (options?.signal?.aborted) {
            return Promise.reject(new AbortError());
        }

        return new Promise((resolve, reject) => {
            const node = new LinkedList.Node<CommandWaitingToBeSent>({
                args,
                chainId: options?.chainId,
                bufferMode,
                resolve,
                reject
            });

            if (options?.signal) {
                const listener = () => {
                    this.#waitingToBeSent.removeNode(node);
                    node.value.reject(new AbortError());
                };

                node.value.abort = {
                    signal: options.signal,
                    listener
                };
                // AbortSignal type is incorrent
                (options.signal as any).addEventListener('abort', listener, {
                    once: true
                });
            }

            if (options?.asap) {
                this.#waitingToBeSent.unshiftNode(node);
            } else {
                this.#waitingToBeSent.pushNode(node);
            }
        });
    }

    #initiatePubSubState(): PubSubState {
        return this.#pubSubState ??= {
            subscribed: 0,
            subscribing: 0,
            unsubscribing: 0,
            listeners: {
                channels: new Map(),
                patterns: new Map()
            }
        };
    }

    subscribe<T extends boolean>(
        command: PubSubSubscribeCommands,
        channels: PubSubArgumentTypes | Array<PubSubArgumentTypes>,
        listener: PubSubListener<T>,
        bufferMode?: T
    ): Promise<void> {
        const pubSubState = this.#initiatePubSubState(),
            channelsToSubscribe: Array<PubSubArgumentTypes> = [],
            listenersMap = command === PubSubSubscribeCommands.SUBSCRIBE ? pubSubState.listeners.channels : pubSubState.listeners.patterns;
        for (const channel of (Array.isArray(channels) ? channels : [channels])) {
            const channelString = typeof channel === 'string' ? channel : channel.toString();
            let listeners = listenersMap.get(channelString);
            if (!listeners) {
                listeners = {
                    buffers: new Set(),
                    strings: new Set()
                };
                listenersMap.set(channelString, listeners);
                channelsToSubscribe.push(channel);
            }

            // https://github.com/microsoft/TypeScript/issues/23132
            (bufferMode ? listeners.buffers : listeners.strings).add(listener as any);
        }

        if (!channelsToSubscribe.length) {
            return Promise.resolve();
        }

        return this.#pushPubSubCommand(command, channelsToSubscribe);
    }

    unsubscribe<T extends boolean>(
        command: PubSubUnsubscribeCommands,
        channels?: string | Array<string>,
        listener?: PubSubListener<T>,
        bufferMode?: T
    ): Promise<void> {
        if (!this.#pubSubState) {
            return Promise.resolve();
        }

        const listeners = command === PubSubUnsubscribeCommands.UNSUBSCRIBE ?
            this.#pubSubState.listeners.channels :
            this.#pubSubState.listeners.patterns;

        if (!channels) {
            const size = listeners.size;
            listeners.clear();
            return this.#pushPubSubCommand(command, size);
        }

        const channelsToUnsubscribe = [];
        for (const channel of (Array.isArray(channels) ? channels : [channels])) {
            const sets = listeners.get(channel);
            if (!sets) continue;

            let shouldUnsubscribe;
            if (listener) {
                // https://github.com/microsoft/TypeScript/issues/23132
                (bufferMode ? sets.buffers : sets.strings).delete(listener as any);
                shouldUnsubscribe = !sets.buffers.size && !sets.strings.size;
            } else {
                shouldUnsubscribe = true;
            }

            if (shouldUnsubscribe) {
                channelsToUnsubscribe.push(channel);
                listeners.delete(channel);
            }
        }

        if (!channelsToUnsubscribe.length) {
            return Promise.resolve();
        }

        return this.#pushPubSubCommand(command, channelsToUnsubscribe);
    }

    #pushPubSubCommand(command: PubSubSubscribeCommands | PubSubUnsubscribeCommands, channels: number | Array<PubSubArgumentTypes>): Promise<void> {
        return new Promise((resolve, reject) => {
            const pubSubState = this.#initiatePubSubState(),
                isSubscribe = command === PubSubSubscribeCommands.SUBSCRIBE || command === PubSubSubscribeCommands.PSUBSCRIBE,
                inProgressKey = isSubscribe ? 'subscribing' : 'unsubscribing',
                commandArgs: Array<PubSubArgumentTypes> = [command];

            let channelsCounter: number;
            if (typeof channels === 'number') { // unsubscribe only
                channelsCounter = channels;
            } else {
                commandArgs.push(...channels);
                channelsCounter = channels.length;
            }

            pubSubState[inProgressKey] += channelsCounter;

            this.#waitingToBeSent.push({
                args: commandArgs,
                channelsCounter,
                bufferMode: true,
                resolve: () => {
                    pubSubState[inProgressKey] -= channelsCounter;
                    if (isSubscribe) {
                        pubSubState.subscribed += channelsCounter;
                    } else {
                        pubSubState.subscribed -= channelsCounter;
                        if (!pubSubState.subscribed && !pubSubState.subscribing && !pubSubState.subscribed) {
                            this.#pubSubState = undefined;
                        }
                    }
                    resolve();
                },
                reject: () => {
                    pubSubState[inProgressKey] -= channelsCounter * (isSubscribe ? 1 : -1);
                    reject();
                }
            });
        });
    }

    resubscribe(): Promise<any> | undefined {
        if (!this.#pubSubState) {
            return;
        }

        // TODO: acl error on one channel/pattern will reject the whole command
        return Promise.all([
            this.#pushPubSubCommand(PubSubSubscribeCommands.SUBSCRIBE, [...this.#pubSubState.listeners.channels.keys()]),
            this.#pushPubSubCommand(PubSubSubscribeCommands.PSUBSCRIBE, [...this.#pubSubState.listeners.patterns.keys()])
        ]);
    }

    getCommandToSend(): RedisCommandArguments | undefined {
        const toSend = this.#waitingToBeSent.shift();

        if (toSend) {
            this.#waitingForReply.push({
                resolve: toSend.resolve,
                reject: toSend.reject,
                channelsCounter: toSend.channelsCounter,
                bufferMode: toSend.bufferMode
            });
        }

        this.#chainInExecution = toSend?.chainId;

        return toSend?.args;
    }

    parseResponse(data: Buffer): void {
        this.#parser.setReturnBuffers(
            !!this.#waitingForReply.head?.value.bufferMode ||
            !!this.#pubSubState?.subscribed
        );
        this.#parser.execute(data);
    }

    #shiftWaitingForReply(): CommandWaitingForReply {
        if (!this.#waitingForReply.length) {
            throw new Error('Got an unexpected reply from Redis');
        }

        return this.#waitingForReply.shift()!;
    }

    flushWaitingForReply(err: Error): void {
        RedisCommandsQueue.#flushQueue(this.#waitingForReply, err);

        if (!this.#chainInExecution) {
            return;
        }

        while (this.#waitingToBeSent.head?.value.chainId === this.#chainInExecution) {
            this.#waitingToBeSent.shift();
        }

        this.#chainInExecution = undefined;
    }

    flushAll(err: Error): void {
        RedisCommandsQueue.#flushQueue(this.#waitingForReply, err);
        RedisCommandsQueue.#flushQueue(this.#waitingToBeSent, err);
    }
}
