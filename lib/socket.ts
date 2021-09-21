import EventEmitter from 'events';
import net from 'net';
import tls from 'tls';
import { ConnectionTimeoutError, ClientClosedError } from './errors';
import { promiseTimeout } from './utils';

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

export interface RedisTlsSocketOptions extends RedisNetSocketOptions, tls.SecureContextOptions {
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

    get isSocketExists(): boolean {
        return !!this.#socket;
    }

    constructor(initiator?: RedisSocketInitiator, options?: RedisSocketOptions) {
        super();

        this.#initiator = initiator;
        this.#options = RedisSocket.#initiateOptions(options);
    }

    async connect(): Promise<void> {
        if (this.#isOpen) {
            throw new Error('Socket is connection/connecting');
        }

        this.#isOpen = true;

        try {
            await this.#connect();
        } catch (err) {
            this.#isOpen = false;
            throw err;
        }
    }

    async #connect(hadError?: boolean): Promise<void> {
        this.#socket = await this.#retryConnection(0, hadError);
        this.emit('connect');

        if (this.#initiator) {
            try {
                await this.#initiator();
            } catch (err) {
                this.#socket.end();
                this.#socket = undefined;
                throw err;
            }
        }

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
                                this.#onSocketError(new Error('Socket closed unexpectedly'));
                            }
                        })
                        .on('drain', () => this.emit('drain'))
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
        this.#socket = undefined;
        this.emit('error', err);

        this.#connect(true)
            .catch(err => this.emit('error', err));
    }

    write(toWrite: string | Buffer): boolean {
        if (!this.#socket) {
            throw new ClientClosedError();
        }

        return this.#socket.write(toWrite);
    }

    async disconnect(ignoreIsOpen = false): Promise<void> {
        if ((!ignoreIsOpen && !this.#isOpen) || !this.#socket) {
            throw new ClientClosedError();
        } else {
            this.#isOpen = false;
        }

        this.#socket.end();
        await EventEmitter.once(this.#socket, 'end');
        this.#socket = undefined;
        this.emit('end');
    }

    async quit(fn: () => Promise<unknown>): Promise<void> {
        if (!this.#isOpen) {
            throw new ClientClosedError();
        }

        this.#isOpen = false;


        try {
            await fn();
            await this.disconnect(true);
        } catch (err) {
            this.#isOpen = true;
            throw err;
        }
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
