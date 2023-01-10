import * as LinkedList from 'yallist';
import { AbortError, ErrorReply } from '../errors';
import { RedisCommandArguments, RedisCommandRawReply } from '../commands';
import RESP2Decoder from './RESP2/decoder';
import encodeCommand from './RESP2/encoder';
import { ChannelListeners, PubSub, PubSubCommand, PubSubListener, PubSubType, PubSubTypeListeners } from './pub-sub';

export interface QueueCommandOptions {
    asap?: boolean;
    chainId?: symbol;
    signal?: AbortSignal;
    returnBuffers?: boolean;
}

export interface CommandWaitingToBeSent extends CommandWaitingForReply {
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

const PONG = Buffer.from('pong');

export type OnShardedChannelMoved = (channel: string, listeners: ChannelListeners) => void;

export default class RedisCommandsQueue {
    static #flushQueue<T extends CommandWaitingForReply>(queue: LinkedList<T>, err: Error): void {
        while (queue.length) {
            queue.shift()!.reject(err);
        }
    }

    readonly #maxLength: number | null | undefined;
    readonly #waitingToBeSent = new LinkedList<CommandWaitingToBeSent>();
    readonly #waitingForReply = new LinkedList<CommandWaitingForReply>();
    readonly #onShardedChannelMoved: OnShardedChannelMoved;

    readonly #pubSub = new PubSub();

    get isPubSubActive() {
        return this.#pubSub.isActive;
    }

    #chainInExecution: symbol | undefined;

    #decoder = new RESP2Decoder({
        returnStringsAsBuffers: () => {
            return !!this.#waitingForReply.head?.value.returnBuffers ||
                this.#pubSub.isActive;
        },
        onReply: reply => {
            if (this.#pubSub.isActive && Array.isArray(reply)) {
                if (this.#pubSub.handleMessageReply(reply as Array<Buffer>)) return;
                
                const isShardedUnsubscribe = PubSub.isShardedUnsubscribe(reply as Array<Buffer>);
                if (isShardedUnsubscribe && !this.#waitingForReply.length) {
                    const channel = (reply[1] as Buffer).toString();
                    this.#onShardedChannelMoved(
                        channel,
                        this.#pubSub.removeShardedListeners(channel)
                    );
                    return;
                } else if (isShardedUnsubscribe || PubSub.isStatusReply(reply as Array<Buffer>)) {
                    const head = this.#waitingForReply.head!.value;
                    if (
                        (Number.isNaN(head.channelsCounter!) && reply[2] === 0) ||
                        --head.channelsCounter! === 0
                    ) {
                        this.#waitingForReply.shift()!.resolve();
                    }
                    return;
                }
                if (PONG.equals(reply[0] as Buffer)) {
                    const { resolve, returnBuffers } = this.#waitingForReply.shift()!,
                        buffer = ((reply[1] as Buffer).length === 0 ? reply[0] : reply[1]) as Buffer;
                    resolve(returnBuffers ? buffer : buffer.toString());
                    return;
                }
            }
            
            const { resolve, reject } = this.#waitingForReply.shift()!;
            if (reply instanceof ErrorReply) {
                reject(reply);
            } else {
                resolve(reply);
            }
        }
    });

    constructor(
        maxLength: number | null | undefined,
        onShardedChannelMoved: OnShardedChannelMoved
    ) {
        this.#maxLength = maxLength;
        this.#onShardedChannelMoved = onShardedChannelMoved;
    }

    addCommand<T = RedisCommandRawReply>(args: RedisCommandArguments, options?: QueueCommandOptions): Promise<T> {
        if (this.#maxLength && this.#waitingToBeSent.length + this.#waitingForReply.length >= this.#maxLength) {
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
        type: PubSubType,
        channels: string | Array<string>,
        listener: PubSubListener<T>,
        returnBuffers?: T
    ) {
        return this.#pushPubSubCommand(
            this.#pubSub.subscribe(type, channels, listener, returnBuffers)
        );
    }

    unsubscribe<T extends boolean>(
        type: PubSubType,
        channels?: string | Array<string>,
        listener?: PubSubListener<T>,
        returnBuffers?: T
    ) {
        return this.#pushPubSubCommand(
            this.#pubSub.unsubscribe(type, channels, listener, returnBuffers)
        );
    }

    resubscribe(): Promise<any> | undefined {
        const commands = this.#pubSub.resubscribe();
        if (!commands.length) return;

        return Promise.all(
            commands.map(command => this.#pushPubSubCommand(command))
        );
    }

    extendPubSubChannelListeners(
        type: PubSubType,
        channel: string,
        listeners: ChannelListeners
    ) {
        return this.#pushPubSubCommand(
            this.#pubSub.extendChannelListeners(type, channel, listeners)
        );
    }

    extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
        return this.#pushPubSubCommand(
            this.#pubSub.extendTypeListeners(type, listeners)
        );
    }

    getPubSubListeners(type: PubSubType) {
        return this.#pubSub.getTypeListeners(type);
    }

    #pushPubSubCommand(command: PubSubCommand) {
        if (command === undefined) return;

        return new Promise<void>((resolve, reject) => {
            this.#waitingToBeSent.push({
                args: command.args,
                channelsCounter: command.channelsCounter,
                returnBuffers: true,
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

    flushWaitingForReply(err: Error): void {
        this.#decoder.reset();
        this.#pubSub.reset();
        RedisCommandsQueue.#flushQueue(this.#waitingForReply, err);

        if (!this.#chainInExecution) return;

        while (this.#waitingToBeSent.head?.value.chainId === this.#chainInExecution) {
            this.#waitingToBeSent.shift();
        }

        this.#chainInExecution = undefined;
    }

    flushAll(err: Error): void {
        this.#decoder.reset();
        this.#pubSub.reset();
        RedisCommandsQueue.#flushQueue(this.#waitingForReply, err);
        RedisCommandsQueue.#flushQueue(this.#waitingToBeSent, err);
    }
}
