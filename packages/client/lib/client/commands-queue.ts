import * as LinkedList from 'yallist';
import { AbortError, ErrorReply } from '../errors';
import { RedisCommandArgument, RedisCommandArguments, RedisCommandRawReply } from '../commands';
import RESP2Decoder from './RESP2/decoder';
import encodeCommand from './RESP2/encoder';

export interface QueueCommandOptions {
    asap?: boolean;
    chainId?: symbol;
    signal?: AbortSignal;
    returnBuffers?: boolean;
    ignorePubSubMode?: boolean;
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
    reject(err: unknown): void;
    channelsCounter?: number;
    returnBuffers?: boolean;
}

export enum PubSubSubscribeCommands {
    SUBSCRIBE = 'SUBSCRIBE',
    PSUBSCRIBE = 'PSUBSCRIBE'
}

export enum PubSubUnsubscribeCommands {
    UNSUBSCRIBE = 'UNSUBSCRIBE',
    PUNSUBSCRIBE = 'PUNSUBSCRIBE'
}

export type PubSubListener<
    RETURN_BUFFERS extends boolean = false,
    T = RETURN_BUFFERS extends true ? Buffer : string
> = (message: T, channel: T) => unknown;

interface PubSubListeners {
    buffers: Set<PubSubListener<true>>;
    strings: Set<PubSubListener<false>>;
}

type PubSubListenersMap = Map<string, PubSubListeners>;

export default class RedisCommandsQueue {
    static #flushQueue<T extends CommandWaitingForReply>(queue: LinkedList<T>, err: Error): void {
        while (queue.length) {
            queue.shift()!.reject(err);
        }
    }

    static #emitPubSubMessage(listenersMap: PubSubListenersMap, message: Buffer, channel: Buffer, pattern?: Buffer): void {
        const keyString = (pattern ?? channel).toString(),
            listeners = listenersMap.get(keyString);

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

    readonly #maxLength: number | null | undefined;
    readonly #waitingToBeSent = new LinkedList<CommandWaitingToBeSent>();
    readonly #waitingForReply = new LinkedList<CommandWaitingForReply>();

    readonly #pubSubState = {
        isActive: false,
        subscribing: 0,
        subscribed: 0,
        unsubscribing: 0,
        listeners: {
            channels: new Map(),
            patterns: new Map()
        }
    };

    static readonly #PUB_SUB_MESSAGES = {
        message: Buffer.from('message'),
        pMessage: Buffer.from('pmessage'),
        subscribe: Buffer.from('subscribe'),
        pSubscribe: Buffer.from('psubscribe'),
        unsubscribe: Buffer.from('unsubscribe'),
        pUnsubscribe: Buffer.from('punsubscribe')
    };

    #chainInExecution: symbol | undefined;

    #decoder = new RESP2Decoder({
        returnStringsAsBuffers: () => {
            return !!this.#waitingForReply.head?.value.returnBuffers ||
                this.#pubSubState.isActive;
        },
        onReply: reply => {
            if (this.#handlePubSubReply(reply)) {
                return;
            } else if (!this.#waitingForReply.length) {
                throw new Error('Got an unexpected reply from Redis');
            }

            const { resolve, reject } = this.#waitingForReply.shift()!;
            if (reply instanceof ErrorReply) {
                reject(reply);
            } else {
                resolve(reply);
            }
        }
    });

    constructor(maxLength: number | null | undefined) {
        this.#maxLength = maxLength;
    }

    addCommand<T = RedisCommandRawReply>(args: RedisCommandArguments, options?: QueueCommandOptions): Promise<T> {
        if (this.#pubSubState.isActive && !options?.ignorePubSubMode) {
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
                returnBuffers: options?.returnBuffers,
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

    subscribe<T extends boolean>(
        command: PubSubSubscribeCommands,
        channels: RedisCommandArgument | Array<RedisCommandArgument>,
        listener: PubSubListener<T>,
        returnBuffers?: T
    ): Promise<void> {
        const channelsToSubscribe: Array<RedisCommandArgument> = [],
            listenersMap = command === PubSubSubscribeCommands.SUBSCRIBE ?
                this.#pubSubState.listeners.channels :
                this.#pubSubState.listeners.patterns;
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
            (returnBuffers ? listeners.buffers : listeners.strings).add(listener as any);
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
        returnBuffers?: T
    ): Promise<void> {
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
                (returnBuffers ? sets.buffers : sets.strings).delete(listener as any);
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

    #pushPubSubCommand(command: PubSubSubscribeCommands | PubSubUnsubscribeCommands, channels: number | Array<RedisCommandArgument>): Promise<void> {
        return new Promise((resolve, reject) => {
            const isSubscribe = command === PubSubSubscribeCommands.SUBSCRIBE || command === PubSubSubscribeCommands.PSUBSCRIBE,
                inProgressKey = isSubscribe ? 'subscribing' : 'unsubscribing',
                commandArgs: Array<RedisCommandArgument> = [command];

            let channelsCounter: number;
            if (typeof channels === 'number') { // unsubscribe only
                channelsCounter = channels;
            } else {
                commandArgs.push(...channels);
                channelsCounter = channels.length;
            }

            this.#pubSubState.isActive = true;
            this.#pubSubState[inProgressKey] += channelsCounter;

            this.#waitingToBeSent.push({
                args: commandArgs,
                channelsCounter,
                returnBuffers: true,
                resolve: () => {
                    this.#pubSubState[inProgressKey] -= channelsCounter;
                    this.#pubSubState.subscribed += channelsCounter * (isSubscribe ? 1 : -1);
                    this.#updatePubSubActiveState();
                    resolve();
                },
                reject: err => {
                    this.#pubSubState[inProgressKey] -= channelsCounter * (isSubscribe ? 1 : -1);
                    this.#updatePubSubActiveState();
                    reject(err);
                }
            });
        });
    }

    #updatePubSubActiveState(): void {
        if (
            !this.#pubSubState.subscribed &&
            !this.#pubSubState.subscribing &&
            !this.#pubSubState.subscribed
        ) {
            this.#pubSubState.isActive = false;
        }
    }

    resubscribe(): Promise<any> | undefined {
        this.#pubSubState.subscribed = 0;
        this.#pubSubState.subscribing = 0;
        this.#pubSubState.unsubscribing = 0;

        const promises = [],
            { channels, patterns } = this.#pubSubState.listeners;

        if (channels.size) {
            promises.push(
                this.#pushPubSubCommand(
                    PubSubSubscribeCommands.SUBSCRIBE,
                    [...channels.keys()]
                )
            );
        }

        if (patterns.size) {
            promises.push(
                this.#pushPubSubCommand(
                    PubSubSubscribeCommands.PSUBSCRIBE,
                    [...patterns.keys()]
                )
            );
        }

        if (promises.length) {
            return Promise.all(promises);
        }
    }

    getCommandToSend(): RedisCommandArguments | undefined {
        const toSend = this.#waitingToBeSent.shift();
        if (!toSend) return;

        let encoded: RedisCommandArguments;
        try {
            encoded = encodeCommand(toSend.args);
        } catch (err) {
            toSend.reject(err);
            return;
        }

        this.#waitingForReply.push({
            resolve: toSend.resolve,
            reject: toSend.reject,
            channelsCounter: toSend.channelsCounter,
            returnBuffers: toSend.returnBuffers
        });
        this.#chainInExecution = toSend.chainId;
        return encoded;
    }

    onReplyChunk(chunk: Buffer): void {
        this.#decoder.write(chunk);
    }

    #handlePubSubReply(reply: any): boolean {
        if (!this.#pubSubState.isActive || !Array.isArray(reply)) return false;

        if (RedisCommandsQueue.#PUB_SUB_MESSAGES.message.equals(reply[0])) {
            RedisCommandsQueue.#emitPubSubMessage(
                this.#pubSubState.listeners.channels,
                reply[2],
                reply[1]
            );
        } else if (RedisCommandsQueue.#PUB_SUB_MESSAGES.pMessage.equals(reply[0])) {
            RedisCommandsQueue.#emitPubSubMessage(
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
                this.#waitingForReply.shift()!.resolve();
            }
        }

        return true;
    }

    flushWaitingForReply(err: Error): void {
        this.#decoder.reset();
        this.#pubSubState.isActive = false;
        RedisCommandsQueue.#flushQueue(this.#waitingForReply, err);

        if (!this.#chainInExecution) return;

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
