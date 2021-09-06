import LinkedList from 'yallist';
import RedisParser from 'redis-parser';
import { AbortError } from './errors';
import { RedisReply } from './commands';
import { encodeCommand } from './commander';

export interface QueueCommandOptions {
    asap?: boolean;
    signal?: any; // TODO: `AbortSignal` type is incorrect
    chainId?: symbol;
}

interface CommandWaitingToBeSent extends CommandWaitingForReply {
    encodedCommand: string;
    byteLength: number;
    chainId?: symbol;
    abort?: {
        signal: any; // TODO: `AbortSignal` type is incorrect
        listener(): void;
    };
}

interface CommandWaitingForReply {
    resolve(reply?: any): void;
    reject(err: Error): void;
    channelsCounter?: number;
}

export type CommandsQueueExecutor = (encodedCommands: string) => boolean | undefined;

export enum PubSubSubscribeCommands {
    SUBSCRIBE = 'SUBSCRIBE',
    PSUBSCRIBE = 'PSUBSCRIBE'
}

export enum PubSubUnsubscribeCommands {
    UNSUBSCRIBE = 'UNSUBSCRIBE',
    PUNSUBSCRIBE = 'PUNSUBSCRIBE'
}

export type PubSubListener = (message: string, channel: string) => unknown;

export type PubSubListenersMap = Map<string, Set<PubSubListener>>;

export default class RedisCommandsQueue {
    static #flushQueue<T extends CommandWaitingForReply>(queue: LinkedList<T>, err: Error): void {
        while (queue.length) {
            queue.shift()!.reject(err);
        }
    }

    static #emitPubSubMessage(listeners: Set<PubSubListener>, message: string, channel: string): void {
        for (const listener of listeners) {
            listener(message, channel);
        }
    }

    readonly #maxLength: number | null | undefined;

    readonly #executor: CommandsQueueExecutor;

    readonly #waitingToBeSent = new LinkedList<CommandWaitingToBeSent>();

    #waitingToBeSentCommandsLength = 0;

    get waitingToBeSentCommandsLength() {
        return this.#waitingToBeSentCommandsLength;
    }

    readonly #waitingForReply = new LinkedList<CommandWaitingForReply>();

    readonly #pubSubState = {
        subscribing: 0,
        subscribed: 0,
        unsubscribing: 0
    };

    readonly #pubSubListeners = {
        channels: <PubSubListenersMap>new Map(),
        patterns: <PubSubListenersMap>new Map()
    };

    readonly #parser = new RedisParser({
        returnReply: (reply: unknown) => {
            if ((this.#pubSubState.subscribing || this.#pubSubState.subscribed) && Array.isArray(reply)) {
                switch (reply[0]) {
                    case 'message':
                        return RedisCommandsQueue.#emitPubSubMessage(
                            this.#pubSubListeners.channels.get(reply[1])!,
                            reply[2],
                            reply[1]
                        );

                    case 'pmessage':
                        return RedisCommandsQueue.#emitPubSubMessage(
                            this.#pubSubListeners.patterns.get(reply[1])!,
                            reply[3],
                            reply[2]
                        );

                    case 'subscribe':
                    case 'psubscribe':
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

    constructor(maxLength: number | null | undefined, executor: CommandsQueueExecutor) {
        this.#maxLength = maxLength;
        this.#executor = executor;
    }

    addEncodedCommand<T = RedisReply>(encodedCommand: string, options?: QueueCommandOptions): Promise<T> {
        if (this.#pubSubState.subscribing || this.#pubSubState.subscribed) {
            return Promise.reject(new Error('Cannot send commands in PubSub mode'));
        } else if (this.#maxLength && this.#waitingToBeSent.length + this.#waitingForReply.length >= this.#maxLength) {
            return Promise.reject(new Error('The queue is full'));
        } else if (options?.signal?.aborted) {
            return Promise.reject(new AbortError());
        }

        return new Promise((resolve, reject) => {
            const node = new LinkedList.Node<CommandWaitingToBeSent>({
                encodedCommand,
                byteLength: Buffer.byteLength(encodedCommand),
                chainId: options?.chainId,
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
                options.signal.addEventListener('abort', listener, {
                    once: true
                });
            }

            if (options?.asap) {
                this.#waitingToBeSent.unshiftNode(node);
            } else {
                this.#waitingToBeSent.pushNode(node);
            }

            this.#waitingToBeSentCommandsLength += node.value.byteLength;
        });
    }

    subscribe(command: PubSubSubscribeCommands, channels: string | Array<string>, listener: PubSubListener): Promise<void> {
        const channelsToSubscribe: Array<string> = [],
            listeners = command === PubSubSubscribeCommands.SUBSCRIBE ? this.#pubSubListeners.channels : this.#pubSubListeners.patterns;
        for (const channel of (Array.isArray(channels) ? channels : [channels])) {
            if (listeners.has(channel)) {
                listeners.get(channel)!.add(listener);
                continue;
            }

            listeners.set(channel, new Set([listener]));
            channelsToSubscribe.push(channel);
        }

        if (!channelsToSubscribe.length) {
            return Promise.resolve();
        }

        return this.#pushPubSubCommand(command, channelsToSubscribe);
    }

    unsubscribe(command: PubSubUnsubscribeCommands, channels?: string | Array<string>, listener?: PubSubListener): Promise<void> {
        const listeners = command === PubSubUnsubscribeCommands.UNSUBSCRIBE ? this.#pubSubListeners.channels : this.#pubSubListeners.patterns;
        if (!channels) {
            listeners.clear();
            return this.#pushPubSubCommand(command);
        }

        const channelsToUnsubscribe = [];
        for (const channel of (Array.isArray(channels) ? channels : [channels])) {
            const set = listeners.get(channel);
            if (!set) continue;

            let shouldUnsubscribe = !listener;
            if (listener) {
                set.delete(listener);
                shouldUnsubscribe = set.size === 0;
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

    #pushPubSubCommand(command: PubSubSubscribeCommands | PubSubUnsubscribeCommands, channels?: Array<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            const isSubscribe = command === PubSubSubscribeCommands.SUBSCRIBE || command === PubSubSubscribeCommands.PSUBSCRIBE,
                inProgressKey = isSubscribe ? 'subscribing' : 'unsubscribing',
                commandArgs: Array<string> = [command];
            let channelsCounter: number;
            if (channels?.length) {
                commandArgs.push(...channels);
                channelsCounter = channels.length;
            } else {
                // unsubscribe only
                channelsCounter = (
                    command[0] === 'P' ?
                    this.#pubSubListeners.patterns :
                    this.#pubSubListeners.channels
                ).size;
            }

            this.#pubSubState[inProgressKey] += channelsCounter;

            const encodedCommand = encodeCommand(commandArgs),
                byteLength = Buffer.byteLength(encodedCommand);
            this.#waitingToBeSent.push({
                encodedCommand,
                byteLength,
                channelsCounter,
                resolve: () => {
                    this.#pubSubState[inProgressKey] -= channelsCounter;
                    this.#pubSubState.subscribed += channelsCounter * (isSubscribe ? 1 : -1);
                    resolve();
                },
                reject: () => {
                    this.#pubSubState[inProgressKey] -= channelsCounter;
                    reject();
                }
            });
            this.#waitingToBeSentCommandsLength += byteLength;
        });
    }

    resubscribe(): Promise<any> | undefined {
        if (!this.#pubSubState.subscribed && !this.#pubSubState.subscribing) {
            return;
        }

        this.#pubSubState.subscribed = this.#pubSubState.subscribing = 0;

        // TODO: acl error on one channel/pattern will reject the whole command
        return Promise.all([
            this.#pushPubSubCommand(PubSubSubscribeCommands.SUBSCRIBE, [...this.#pubSubListeners.channels.keys()]),
            this.#pushPubSubCommand(PubSubSubscribeCommands.PSUBSCRIBE, [...this.#pubSubListeners.patterns.keys()])
        ]);
    }

    executeChunk(recommendedSize: number): boolean | undefined {
        if (!this.#waitingToBeSent.length) return;

        const encoded: Array<string> = [];
        let size = 0,
            lastCommandChainId: symbol | undefined;
        for (const command of this.#waitingToBeSent) {
            encoded.push(command.encodedCommand);
            size += command.byteLength;
            if (size > recommendedSize) {
                lastCommandChainId = command.chainId;
                break;
            }
        }

        if (!lastCommandChainId && encoded.length === this.#waitingToBeSent.length) {
            lastCommandChainId = this.#waitingToBeSent.tail!.value.chainId;
        }

        lastCommandChainId ??= this.#waitingToBeSent.tail?.value.chainId;

        this.#executor(encoded.join(''));

        for (let i = 0; i < encoded.length; i++) {
            const waitingToBeSent = this.#waitingToBeSent.shift()!;
            if (waitingToBeSent.abort) {
                waitingToBeSent.abort.signal.removeEventListener('abort', waitingToBeSent.abort.listener);
            }

            this.#waitingForReply.push({
                resolve: waitingToBeSent.resolve,
                reject: waitingToBeSent.reject,
                channelsCounter: waitingToBeSent.channelsCounter
            });
        }

        this.#chainInExecution = lastCommandChainId;
        this.#waitingToBeSentCommandsLength -= size;
    }

    parseResponse(data: Buffer): void {
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
