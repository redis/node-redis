import { EventEmitter } from 'events';
import * as net from 'net';
import * as tls from 'tls';
import { ConnectionTimeoutError, ClientClosedError, SocketClosedUnexpectedlyError, ReconnectStrategyError } from '../errors';
import { setTimeout } from 'timers/promises';
import { RedisArgument } from '../RESP/types';

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
   * When the socket closes unexpectedly (without calling `.close()`/`.destroy()`), the client uses `reconnectStrategy` to decide what to do. The following values are supported:
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
  private static _initiateOptions(options?: RedisSocketOptions): RedisSocketOptions {
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

  private static _isTlsSocket(options: RedisSocketOptions): options is RedisTlsSocketOptions {
    return (options as RedisTlsSocketOptions).tls === true;
  }

  private readonly _initiator: RedisSocketInitiator;

  private readonly _options: RedisSocketOptions;

  private _socket?: net.Socket | tls.TLSSocket;

  private _isOpen = false;

  get isOpen(): boolean {
    return this._isOpen;
  }

  private _isReady = false;

  get isReady(): boolean {
    return this._isReady;
  }

  private _isSocketUnrefed = false;

  constructor(initiator: RedisSocketInitiator, options?: RedisSocketOptions) {
    super();

    this._initiator = initiator;
    this._options = RedisSocket._initiateOptions(options);
  }

  private _reconnectStrategy(retries: number, cause: Error) {
    if (this._options.reconnectStrategy === false) {
      return false;
    } else if (typeof this._options.reconnectStrategy === 'number') {
      return this._options.reconnectStrategy;
    } else if (this._options.reconnectStrategy) {
      try {
        const retryIn = this._options.reconnectStrategy(retries, cause);
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

  private _shouldReconnect(retries: number, cause: Error) {
    const retryIn = this._reconnectStrategy(retries, cause);
    if (retryIn === false) {
      this._isOpen = false;
      this.emit('error', cause);
      return cause;
    } else if (retryIn instanceof Error) {
      this._isOpen = false;
      this.emit('error', cause);
      return new ReconnectStrategyError(retryIn, cause);
    }

    return retryIn;
  }

  async connect(): Promise<void> {
    if (this._isOpen) {
      throw new Error('Socket already opened');
    }

    this._isOpen = true;
    return this._connect();
  }

  private async _connect(): Promise<void> {
    let retries = 0;
    do {
      try {
        this._socket = await this._createSocket();
        this.emit('connect');

        try {
          await this._initiator();
        } catch (err) {
          this._socket.destroy();
          this._socket = undefined;
          throw err;
        }
        this._isReady = true;
        this.emit('ready');
      } catch (err) {
        const retryIn = this._shouldReconnect(retries++, err as Error);
        if (typeof retryIn !== 'number') {
          throw retryIn;
        }

        this.emit('error', err);
        await setTimeout(retryIn);
        this.emit('reconnecting');
      }
    } while (this._isOpen && !this._isReady);
  }

  private _createSocket(): Promise<net.Socket | tls.TLSSocket> {
    return new Promise((resolve, reject) => {
      const { connectEvent, socket } = RedisSocket._isTlsSocket(this._options) ?
        this._createTlsSocket() :
        this._createNetSocket();

      if (this._options.connectTimeout) {
        socket.setTimeout(this._options.connectTimeout, () => socket.destroy(new ConnectionTimeoutError()));
      }

      if (this._isSocketUnrefed) {
        socket.unref();
      }

      socket
        .setNoDelay(this._options.noDelay)
        .once('error', reject)
        .once(connectEvent, () => {
          socket
            .setTimeout(0)
            // https://github.com/nodejs/node/issues/31663
            .setKeepAlive(this._options.keepAlive !== false, this._options.keepAlive || 0)
            .off('error', reject)
            .once('error', (err: Error) => this._onSocketError(err))
            .once('close', hadError => {
              if (!hadError && this._isOpen && this._socket === socket) {
                this._onSocketError(new SocketClosedUnexpectedlyError());
              }
            })
            .on('drain', () => this.emit('drain'))
            .on('data', data => this.emit('data', data));

          resolve(socket);
        });
    });
  }

  private _createNetSocket(): CreateSocketReturn<net.Socket> {
    return {
      connectEvent: 'connect',
      socket: net.connect(this._options as net.NetConnectOpts) // TODO
    };
  }

  private _createTlsSocket(): CreateSocketReturn<tls.TLSSocket> {
    return {
      connectEvent: 'secureConnect',
      socket: tls.connect(this._options as tls.ConnectionOptions) // TODO
    };
  }

  private _onSocketError(err: Error): void {
    this._isReady = false;
    this.emit('error', err);

    if (!this._isOpen || typeof this._shouldReconnect(0, err) !== 'number') return;

    this.emit('reconnecting');
    this._connect().catch(() => {
      // the error was already emitted, silently ignore it
    });
  }

  write(iterator: IterableIterator<Array<RedisArgument>>): void {
    if (!this._socket) return;
    
    this._socket.cork();
    for (const args of iterator) {
      for (const toWrite of args) {
        this._socket.write(toWrite);
      }

      if (this._socket.writableNeedDrain) break;
    }
    this._socket.uncork();
  }

  async quit<T>(fn: () => Promise<T>): Promise<T> {
    if (!this._isOpen) {
      throw new ClientClosedError();
    }

    this._isOpen = false;
    const reply = await fn();
    this.destroySocket();
    return reply;
  }

  close() {
    if (!this._isOpen) {
      throw new ClientClosedError();
    }

    this._isOpen = false;
  }

  destroy() {
    if (!this._isOpen) {
      throw new ClientClosedError();
    }

    this._isOpen = false;
    this.destroySocket();
  }

  destroySocket() {
    this._isReady = false;

    if (this._socket) {
      this._socket.destroy();
      this._socket = undefined;
    }

    this.emit('end');
  }

  ref(): void {
    this._isSocketUnrefed = false;
    this._socket?.ref();
  }

  unref(): void {
    this._isSocketUnrefed = true;
    this._socket?.unref();
  }
}
