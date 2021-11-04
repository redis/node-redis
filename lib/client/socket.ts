import EventEmitter from 'events';
import net from 'net';
import tls from 'tls';
import { encodeCommand } from '../commander';
import { RedisCommandArguments } from '../commands';
import { ConnectionTimeoutError, ClientClosedError, SocketClosedUnexpectedlyError } from '../errors';
import { promiseTimeout } from '../utils';

export interface RedisSocketCommonOptions {
    connectTimeout?: number;
    noDelay?: boolean;
    keepAlive?: number | false;
    reconnectStrategy?(retries: number): number | Error;
}

export interface RedisNetSocketOptions extends RedisSocketCommonOptions {
    port?: number;
    host?: string;
}

export interface RedisUnixSocketOptions extends RedisSocketCommonOptions {
    path: string;
}

export interface RedisTlsSocketOptions extends RedisNetSocketOptions, tls.SecureContextOptions, tls.CommonConnectionOption {
    tls: true;
}

export type RedisSocketOptions = RedisNetSocketOptions | RedisUnixSocketOptions | RedisTlsSocketOptions;

interface CreateSocketReturn<T> {
    connectEvent: string;
    socket: T;
}

export type RedisSocketInitiator = () => Promise<void>;

export default class RedisSocket extends EventEmitter {
    static #initiateOptions(options?: RedisSocketOptions): RedisSocketOptions {
        options ??= {};
        if (!RedisSocket.#isUnixSocket(options)) {
            (options as RedisNetSocketOptions).port ??= 6379;
            (options as RedisNetSocketOptions).host ??= '127.0.0.1';
        }

        options.connectTimeout ??= 5000;
        options.keepAlive ??= 5000;
        options.noDelay ??= true;

        return options;
    }

    static #defaultReconnectStrategy(retries: number): number {
        return Math.min(retries * 50, 500);
    }

    static #isUnixSocket(options: RedisSocketOptions): options is RedisUnixSocketOptions {
        return Object.prototype.hasOwnProperty.call(options, 'path');
    }

    static #isTlsSocket(options: RedisSocketOptions): options is RedisTlsSocketOptions {
        return (options as RedisTlsSocketOptions).tls === true;
    }

    readonly #initiator?: RedisSocketInitiator;

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

    constructor(initiator?: RedisSocketInitiator, options?: RedisSocketOptions) {
        super();

        this.#initiator = initiator;
        this.#options = RedisSocket.#initiateOptions(options);
    }

    async connect(): Promise<void> {
        if (this.#isOpen) {
            throw new Error('Socket already opened');
        }

        return this.#connect();
    }

    async #connect(hadError?: boolean): Promise<void> {
        this.#isOpen = true;
        this.#socket = await this.#retryConnection(0, hadError);
        this.#writableNeedDrain = false;

        if (!this.#isOpen) {
            this.disconnect();
            return;
        }

        this.emit('connect');

        if (this.#initiator) {
            try {
                await this.#initiator();
            } catch (err) {
                this.#socket.destroy();
                this.#socket = undefined;
                this.#isOpen = false;
                throw err;
            }

            if (!this.#isOpen) return;
        }

        this.#isReady = true;

        this.emit('ready');
    }

    async #retryConnection(retries: number, hadError?: boolean): Promise<net.Socket | tls.TLSSocket> {
        if (retries > 0 || hadError) {
            this.emit('reconnecting');
        }

        try {
            return await this.#createSocket();
        } catch (err) {
            this.emit('error', err);

            if (!this.#isOpen) {
                throw err;
            }

            const retryIn = (this.#options?.reconnectStrategy ?? RedisSocket.#defaultReconnectStrategy)(retries);
            if (retryIn instanceof Error) {
                throw retryIn;
            }

            await promiseTimeout(retryIn);
            return this.#retryConnection(retries + 1);
        }
    }

    #createSocket(): Promise<net.Socket | tls.TLSSocket> {
        return new Promise((resolve, reject) => {
            const {connectEvent, socket} = RedisSocket.#isTlsSocket(this.#options) ?
                this.#createTlsSocket() :
                this.#createNetSocket();

            if (this.#options.connectTimeout) {
                socket.setTimeout(this.#options.connectTimeout, () => socket.destroy(new ConnectionTimeoutError()));
            }

            socket
                .setNoDelay(this.#options.noDelay)
                .setKeepAlive(this.#options.keepAlive !== false, this.#options.keepAlive || 0)
                .once('error', reject)
                .once(connectEvent, () => {
                    socket
                        .setTimeout(0)
                        .off('error', reject)
                        .once('error', (err: Error) => this.#onSocketError(err))
                        .once('close', hadError => {
                            if (!hadError && this.#isOpen) {
                                this.#onSocketError(new SocketClosedUnexpectedlyError());
                            }
                        })
                        .on('drain', () => {
                            this.#writableNeedDrain = false;
                            this.emit('drain');
                        })
                        .on('data', (data: Buffer) => this.emit('data', data));

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

        this.#connect(true).catch(() => {
            // the error was already emitted, silently ignore it
        });
    }

    writeCommand(args: RedisCommandArguments): void {
        if (!this.#socket) {
            throw new ClientClosedError();
        }

        for (const toWrite of encodeCommand(args)) {
            this.#writableNeedDrain = !this.#socket.write(toWrite);
        }
    }

    disconnect(): void {
        if (!this.#socket) {
            throw new ClientClosedError();
        } else {
            this.#isOpen = this.#isReady = false;
        }

        this.#socket.destroy();
        this.#socket = undefined;
        this.emit('end');
    }

    async quit(fn: () => Promise<unknown>): Promise<void> {
        if (!this.#isOpen) {
            throw new ClientClosedError();
        }

        this.#isOpen = false;
        await fn();
        this.disconnect();
    }

    #isCorked = false;

    cork(): void {
        if (!this.#socket) {
            return;
        }

        if (!this.#isCorked) {
            this.#socket.cork();
            this.#isCorked = true;

            queueMicrotask(() => {
                this.#socket?.uncork();
                this.#isCorked = false;
            });
        }
    }
}
