import { EventEmitter } from 'events';
import * as net from 'net';
import * as tls from 'tls';
import { RedisCommandArguments } from '../commands';
import { ConnectionTimeoutError, ClientClosedError, SocketClosedUnexpectedlyError, ReconnectStrategyError } from '../errors';
import { promiseTimeout } from '../utils';

export interface RedisSocketCommonOptions {
    connectTimeout?: number;
    noDelay?: boolean;
    keepAlive?: number | false;
    reconnectStrategy?(retries: number): number | Error;
}

type RedisNetSocketOptions = Partial<net.SocketConnectOpts> & {
    tls?: false;
};

export interface RedisTlsSocketOptions extends tls.ConnectionOptions {
    tls: true;
}

export type RedisSocketOptions = RedisSocketCommonOptions & (RedisNetSocketOptions | RedisTlsSocketOptions);

interface CreateSocketReturn<T> {
    connectEvent: string;
    socket: T;
}

export type RedisSocketInitiator = () => Promise<void>;

export default class RedisSocket extends EventEmitter {
    static #initiateOptions(options?: RedisSocketOptions): RedisSocketOptions {
        options ??= {};
        if (!(options as net.IpcSocketConnectOpts).path) {
            (options as net.TcpSocketConnectOpts).port ??= 6379;
            (options as net.TcpSocketConnectOpts).host ??= 'localhost';
        }

        options.connectTimeout ??= 5000;
        options.keepAlive ??= 5000;
        options.noDelay ??= true;

        return options;
    }

    static #isTlsSocket(options: RedisSocketOptions): options is RedisTlsSocketOptions {
        return (options as RedisTlsSocketOptions).tls === true;
    }

    readonly #initiator: RedisSocketInitiator;

    readonly #options: RedisSocketOptions;

    #socket?: net.Socket | tls.TLSSocket;

    #isOpen = false;

    get isOpen(): boolean {
        return this.#isOpen;
    }

    #isReady = false;

    get isReady(): boolean {
        return this.#isReady;
    }

    // `writable.writableNeedDrain` was added in v15.2.0 and therefore can't be used
    // https://nodejs.org/api/stream.html#stream_writable_writableneeddrain
    #writableNeedDrain = false;

    get writableNeedDrain(): boolean {
        return this.#writableNeedDrain;
    }

    #isSocketUnrefed = false;

    constructor(initiator: RedisSocketInitiator, options?: RedisSocketOptions) {
        super();

        this.#initiator = initiator;
        this.#options = RedisSocket.#initiateOptions(options);
    }

    reconnectStrategy(retries: number): number | Error {
        if (this.#options.reconnectStrategy) {
            try {
                const retryIn = this.#options.reconnectStrategy(retries);
                if (typeof retryIn !== 'number' && !(retryIn instanceof Error)) {
                    throw new TypeError('Reconnect strategy should return `number | Error`');
                }

                return retryIn;
            } catch (err) {
                this.emit('error', err);
            }
        }

        return Math.min(retries * 50, 500);
    }

    async connect(): Promise<void> {
        if (this.#isOpen) {
            throw new Error('Socket already opened');
        }

        this.#isOpen = true;
        return this.#connect();
    }

    async #connect(hadError?: boolean): Promise<void> {
        let retries = 0;
        do {
            if (retries > 0 || hadError) {
                this.emit('reconnecting');
            }

            try {
                this.#socket = await this.#createSocket();
                this.#writableNeedDrain = false;
                this.emit('connect');

                try {
                    await this.#initiator();
                } catch (err) {
                    this.#socket.destroy();
                    this.#socket = undefined;
                    throw err;
                }
                this.#isReady = true;
                this.emit('ready');
            } catch (err) {
                const retryIn = this.reconnectStrategy(retries);
                if (retryIn instanceof Error) {
                    this.#isOpen = false;
                    this.emit('error', err);
                    throw new ReconnectStrategyError(retryIn, err);
                }

                this.emit('error', err);
                await promiseTimeout(retryIn);
            }
            retries++;
        } while (this.#isOpen && !this.#isReady);
    }

    #createSocket(): Promise<net.Socket | tls.TLSSocket> {
        return new Promise((resolve, reject) => {
            const { connectEvent, socket } = RedisSocket.#isTlsSocket(this.#options) ?
                this.#createTlsSocket() :
                this.#createNetSocket();

            if (this.#options.connectTimeout) {
                socket.setTimeout(this.#options.connectTimeout, () => socket.destroy(new ConnectionTimeoutError()));
            }

            if (this.#isSocketUnrefed) {
                socket.unref();
            }

            socket
                .setNoDelay(this.#options.noDelay)
                .once('error', reject)
                .once(connectEvent, () => {
                    socket
                        .setTimeout(0)
                        // https://github.com/nodejs/node/issues/31663
                        .setKeepAlive(this.#options.keepAlive !== false, this.#options.keepAlive || 0)
                        .off('error', reject)
                        .once('error', (err: Error) => this.#onSocketError(err))
                        .once('close', hadError => {
                            if (!hadError && this.#isOpen && this.#socket === socket) {
                                this.#onSocketError(new SocketClosedUnexpectedlyError());
                            }
                        })
                        .on('drain', () => {
                            this.#writableNeedDrain = false;
                            this.emit('drain');
                        })
                        .on('data', data => this.emit('data', data));

                    resolve(socket);
                });
        });
    }

    #createNetSocket(): CreateSocketReturn<net.Socket> {
        return {
            connectEvent: 'connect',
            socket: net.connect(this.#options as net.NetConnectOpts) // TODO
        };
    }

    #createTlsSocket(): CreateSocketReturn<tls.TLSSocket> {
        return {
            connectEvent: 'secureConnect',
            socket: tls.connect(this.#options as tls.ConnectionOptions) // TODO
        };
    }

    #onSocketError(err: Error): void {
        this.#isReady = false;
        this.emit('error', err);

        if (!this.#isOpen) return;

        this.#connect(true).catch(() => {
            // the error was already emitted, silently ignore it
        });
    }

    writeCommand(args: RedisCommandArguments): void {
        if (!this.#socket) {
            throw new ClientClosedError();
        }

        for (const toWrite of args) {
            this.#writableNeedDrain = !this.#socket.write(toWrite);
        }
    }

    disconnect(): void {
        if (!this.#isOpen) {
            throw new ClientClosedError();
        }

        this.#isOpen = false;
        this.#disconnect();
    }

    #disconnect(): void {
        this.#isReady = false;

        if (this.#socket) {
            this.#socket.destroy();
            this.#socket = undefined;
        }
        
        this.emit('end');
    }

    async quit(fn: () => Promise<unknown>): Promise<void> {
        if (!this.#isOpen) {
            throw new ClientClosedError();
        }

        this.#isOpen = false;
        await fn();
        this.#disconnect();
    }

    #isCorked = false;

    cork(): void {
        if (!this.#socket || this.#isCorked) {
            return;
        }

        this.#socket.cork();
        this.#isCorked = true;

        queueMicrotask(() => {
            this.#socket?.uncork();
            this.#isCorked = false;
        });
    }

    ref(): void {
        this.#isSocketUnrefed = false;
        this.#socket?.ref();
    }

    unref(): void {
        this.#isSocketUnrefed = true;
        this.#socket?.unref();
    }
}
