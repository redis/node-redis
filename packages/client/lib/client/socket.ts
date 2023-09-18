import { EventEmitter } from 'events';
import * as net from 'net';
import * as tls from 'tls';
import { RedisCommandArguments } from '../commands';
import { ConnectionTimeoutError, ClientClosedError, SocketClosedUnexpectedlyError, ReconnectStrategyError } from '../errors';
import { promiseTimeout } from '../utils';

export interface RedisSocketCommonOptions {
    /**
     * Connection Timeout (in milliseconds)
     */
    connectTimeout?: number;
    /**
     * Toggle [`Nagle's algorithm`](https://nodejs.org/api/net.html#net_socket_setnodelay_nodelay)
     */
    noDelay?: boolean;
    /**
     * Toggle [`keep-alive`](https://nodejs.org/api/net.html#net_socket_setkeepalive_enable_initialdelay)
     */
    keepAlive?: number | false;
    /**
     * When the socket closes unexpectedly (without calling `.quit()`/`.disconnect()`), the client uses `reconnectStrategy` to decide what to do. The following values are supported:
     * 1. `false` -> do not reconnect, close the client and flush the command queue.
     * 2. `number` -> wait for `X` milliseconds before reconnecting.
     * 3. `(retries: number, cause: Error) => false | number | Error` -> `number` is the same as configuring a `number` directly, `Error` is the same as `false`, but with a custom error.
     * Defaults to `retries => Math.min(retries * 50, 500)`
     */
    reconnectStrategy?: false | number | ((retries: number, cause: Error) => false | Error | number);
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

    #reconnectStrategy(retries: number, cause: Error) {
        if (this.#options.reconnectStrategy === false) {
            return false;
        } else if (typeof this.#options.reconnectStrategy === 'number') {
            return this.#options.reconnectStrategy;
        } else if (this.#options.reconnectStrategy) {
            try {
                const retryIn = this.#options.reconnectStrategy(retries, cause);
                if (retryIn !== false && !(retryIn instanceof Error) && typeof retryIn !== 'number') {
                    throw new TypeError(`Reconnect strategy should return \`false | Error | number\`, got ${retryIn} instead`);
                }

                return retryIn;
            } catch (err) {
                this.emit('error', err);    
            }
        }

        return Math.min(retries * 50, 500);
    }

    #shouldReconnect(retries: number, cause: Error) {
        const retryIn = this.#reconnectStrategy(retries, cause);
        if (retryIn === false) {
            this.#isOpen = false;
            this.emit('error', cause);
            return cause;
        } else if (retryIn instanceof Error) {
            this.#isOpen = false;
            this.emit('error', cause);
            return new ReconnectStrategyError(retryIn, cause);
        }

        return retryIn;
    }

    async connect(): Promise<void> {
        if (this.#isOpen) {
            throw new Error('Socket already opened');
        }

        this.#isOpen = true;
        return this.#connect();
    }

    async #connect(): Promise<void> {
        let retries = 0;
        do {
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
                const retryIn = this.#shouldReconnect(retries++, err as Error);
                if (typeof retryIn !== 'number') {
                    throw retryIn;
                }

                this.emit('error', err);
                await promiseTimeout(retryIn);
                this.emit('reconnecting');
            }
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
                            if (!hadError && this.#isReady && this.#socket === socket) {
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

        if (!this.#isOpen || typeof this.#shouldReconnect(0, err) !== 'number') return;
        
        this.emit('reconnecting');
        this.#connect().catch(() => {
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

    async quit<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.#isOpen) {
            throw new ClientClosedError();
        }

        this.#isOpen = false;
        const reply = await fn();
        this.#disconnect();
        return reply;
    }

    #isCorked = false;

    cork(): void {
        if (!this.#socket || this.#isCorked) {
            return;
        }

        this.#socket.cork();
        this.#isCorked = true;

        setImmediate(() => {
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
