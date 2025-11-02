import { EventEmitter, once } from 'node:events';
import net from 'node:net';
import tls from 'node:tls';
import { ConnectionTimeoutError, ClientClosedError, SocketClosedUnexpectedlyError, ReconnectStrategyError, SocketTimeoutError, SocketTimeoutDuringMaintenanceError } from '../errors';
import { setTimeout } from 'node:timers/promises';
import { RedisArgument } from '../RESP/types';
import { dbgMaintenance } from './enterprise-maintenance-manager';

type NetOptions = {
  tls?: false;
};

type ReconnectStrategyFunction = (retries: number, cause: Error) => false | Error | number;

type RedisSocketOptionsCommon = {
  /**
   * Connection timeout (in milliseconds)
   */
  connectTimeout?: number;
  /**
   * When the socket closes unexpectedly (without calling `.close()`/`.destroy()`), the client uses `reconnectStrategy` to decide what to do. The following values are supported:
   * 1. `false` -> do not reconnect, close the client and flush the command queue.
   * 2. `number` -> wait for `X` milliseconds before reconnecting.
   * 3. `(retries: number, cause: Error) => false | number | Error` -> `number` is the same as configuring a `number` directly, `Error` is the same as `false`, but with a custom error.
   */
  reconnectStrategy?: false | number | ReconnectStrategyFunction;
  /**
   * The timeout (in milliseconds) after which the socket will be closed. `undefined` means no timeout.
   */
  socketTimeout?: number;
}

type RedisTcpOptions = RedisSocketOptionsCommon & NetOptions & Omit<
  net.TcpNetConnectOpts,
  'timeout' | 'onread' | 'readable' | 'writable' | 'port'
> & {
  port?: number;
};

type RedisTlsOptions = RedisSocketOptionsCommon & tls.ConnectionOptions & {
  tls: true;
}

type RedisIpcOptions = RedisSocketOptionsCommon & Omit<
  net.IpcNetConnectOpts,
  'timeout' | 'onread' | 'readable' | 'writable'
> & {
  tls: false;
}

export type RedisTcpSocketOptions = RedisTcpOptions | RedisTlsOptions;

export type RedisSocketOptions = RedisTcpSocketOptions | RedisIpcOptions;

export type RedisSocketInitiator = () => void | Promise<unknown>;

export default class RedisSocket extends EventEmitter {
  readonly #initiator;
  readonly #connectTimeout;
  readonly #reconnectStrategy;
  readonly #socketFactory;
  readonly #socketTimeout;

  #maintenanceTimeout: number | undefined;

  #socket?: net.Socket | tls.TLSSocket;

  #isOpen = false;

  get isOpen() {
    return this.#isOpen;
  }

  #isReady = false;

  get isReady() {
    // If socket is closed or destroyed, we're not ready
    if (!this.#isOpen || !this.#socket || this.#socket.destroyed) {
      return false;
    }
    return this.#isReady;
  }

  #isSocketUnrefed = false;

  #socketEpoch = 0;

  get socketEpoch() {
    return this.#socketEpoch;
  }

  #isReconnecting = false;

  constructor(initiator: RedisSocketInitiator, options?: RedisSocketOptions) {
    super();

    this.#initiator = initiator;
    this.#connectTimeout = options?.connectTimeout ?? 5000;
    this.#reconnectStrategy = this.#createReconnectStrategy(options);
    this.#socketFactory = this.#createSocketFactory(options);
    this.#socketTimeout = options?.socketTimeout;
  }

  #createReconnectStrategy(options?: RedisSocketOptions): ReconnectStrategyFunction {
    const strategy = options?.reconnectStrategy;
    if (strategy === false || typeof strategy === 'number') {
      return () => strategy;
    }

    if (strategy) {
      return (retries, cause) => {
        try {
          const retryIn = strategy(retries, cause);
          if (retryIn !== false && !(retryIn instanceof Error) && typeof retryIn !== 'number') {
            throw new TypeError(`Reconnect strategy should return \`false | Error | number\`, got ${retryIn} instead`);
          }
          return retryIn;
        } catch (err) {
          this.emit('error', err);
          return this.defaultReconnectStrategy(retries, err);
        }
      };
    }

    return this.defaultReconnectStrategy;
  }

  #createSocketFactory(options?: RedisSocketOptions) {
    // TLS
    if (options?.tls === true) {
      const withDefaults: tls.ConnectionOptions = {
        ...options,
        port: options?.port ?? 6379,
        // https://nodejs.org/api/tls.html#tlsconnectoptions-callback "Any socket.connect() option not already listed"
        // @types/node is... incorrect...
        // @ts-expect-error
        noDelay: options?.noDelay ?? true,
        // https://nodejs.org/api/tls.html#tlsconnectoptions-callback "Any socket.connect() option not already listed"
        // @types/node is... incorrect...
        // @ts-expect-error
        keepAlive: options?.keepAlive ?? true,
        // https://nodejs.org/api/tls.html#tlsconnectoptions-callback "Any socket.connect() option not already listed"
        // @types/node is... incorrect...
        // @ts-expect-error
        keepAliveInitialDelay: options?.keepAliveInitialDelay ?? 5000,
        timeout: undefined,
        onread: undefined,
        readable: true,
        writable: true
      };
      return {
        create() {
          return tls.connect(withDefaults);
        },
        event: 'secureConnect'
      };
    }

    // IPC
    if (options && 'path' in options) {
      const withDefaults: net.IpcNetConnectOpts = {
        ...options,
        timeout: undefined,
        onread: undefined,
        readable: true,
        writable: true
      };
      return {
        create() {
          return net.createConnection(withDefaults);
        },
        event: 'connect'
      };
    }

    // TCP
    const withDefaults: net.TcpNetConnectOpts = {
      ...options,
      port: options?.port ?? 6379,
      noDelay: options?.noDelay ?? true,
      keepAlive: options?.keepAlive ?? true,
      keepAliveInitialDelay: options?.keepAliveInitialDelay ?? 5000,
      timeout: undefined,
      onread: undefined,
      readable: true,
      writable: true
    };
    return {
      create() {
        return net.createConnection(withDefaults);
      },
      event: 'connect'
    };
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
        // Ensure any existing socket is cleaned up before creating a new one
        if (this.#socket) {
          this.#socket.destroy();
          this.#socket = undefined;
        }

        const socket = await this.#createSocket();

        // Check if connection was cancelled or another attempt started
        if (!this.#isOpen || (this.#socket && this.#socket !== socket)) {
          socket.destroy();
          throw new Error('Connection cancelled or replaced');
        }

        this.#socket = socket;
        this.emit('connect');

        try {
          await this.#initiator();

          // Verify socket is still valid and current after initiator completes
          if (!this.#isOpen || this.#socket !== socket || socket.destroyed) {
            throw new Error('Socket invalidated during handshake');
          }
        } catch (err) {
          // Cleanup socket if it's still the current one
          if (this.#socket === socket) {
            this.#socket.destroy();
            this.#socket = undefined;
          } else {
            socket.destroy();
          }
          throw err;
        }

        // Final verification before marking ready - socket must be current, connection open, socket not destroyed, and writable
        if (!this.#isOpen || this.#socket !== socket || socket.destroyed || !socket.writable) {
          throw new Error('Socket invalidated before marking ready');
        }

        this.#isReady = true;
        this.#socketEpoch++;
        this.#isReconnecting = false;

        // Critical final check right before emitting ready - socket must be fully valid
        // If socket was destroyed or closed between setting isReady and emitting ready, don't emit
        if (this.#socket !== socket || socket.destroyed || !this.#isOpen || !socket.writable) {
          this.#isReady = false;
          throw new Error('Socket became invalid after marking ready');
        }

        this.emit('ready');
      } catch (err) {
        const retryIn = this.#shouldReconnect(retries++, err as Error);
        if (typeof retryIn !== 'number') {
          this.#isReconnecting = false;
          throw retryIn;
        }

        this.emit('error', err);
        await setTimeout(retryIn);
        // Only emit 'reconnecting' if we're already in a reconnection cycle
        // (i.e., called from #onSocketError). Initial connection retries don't emit this.
        if (this.#isReconnecting) {
          this.emit('reconnecting');
        }
      }
    } while (this.#isOpen && !this.#isReady);
    this.#isReconnecting = false;
  }

  setMaintenanceTimeout(ms?: number) {
    dbgMaintenance(`Set socket timeout to ${ms}`);
    if (this.#maintenanceTimeout === ms) {
      dbgMaintenance(`Socket already set maintenanceCommandTimeout to ${ms}, skipping`);
      return;
    };

    this.#maintenanceTimeout = ms;

    if(ms !== undefined) {
      this.#socket?.setTimeout(ms);
    } else {
      this.#socket?.setTimeout(this.#socketTimeout ?? 0);
    }
  }

  async #createSocket(): Promise<net.Socket | tls.TLSSocket> {
    const socket = this.#socketFactory.create();

    let onTimeout;
    if (this.#connectTimeout !== undefined) {
      onTimeout = () => socket.destroy(new ConnectionTimeoutError());
      socket.once('timeout', onTimeout);
      socket.setTimeout(this.#connectTimeout);
    }

    if (this.#isSocketUnrefed) {
      socket.unref();
    }

    await once(socket, this.#socketFactory.event);

    if (onTimeout) {
      socket.removeListener('timeout', onTimeout);
    }

    if (this.#socketTimeout) {
      socket.once('timeout', () => {
        const error = this.#maintenanceTimeout
          ? new SocketTimeoutDuringMaintenanceError(this.#maintenanceTimeout)
          : new SocketTimeoutError(this.#socketTimeout!)
        socket.destroy(error);
      });
      socket.setTimeout(this.#socketTimeout);
    }

    socket
      .once('error', err => this.#onSocketError(err))
      .once('close', hadError => {
        if (hadError || !this.#isOpen || this.#socket !== socket) return;
        this.#onSocketError(new SocketClosedUnexpectedlyError());
      })
      .on('drain', () => this.emit('drain'))
      .on('data', data => this.emit('data', data));

    return socket;
  }

  #onSocketError(err: Error): void {
    const wasReady = this.#isReady;
    this.#isReady = false;
    this.emit('error', err);

    if (!wasReady || !this.#isOpen || typeof this.#shouldReconnect(0, err) !== 'number') {
      return;
    }

    // Prevent concurrent reconnection attempts - set flag atomically
    if (this.#isReconnecting) {
      return;
    }
    this.#isReconnecting = true;

    // Destroy existing socket before starting new reconnection
    if (this.#socket) {
      this.#socket.destroy();
      this.#socket = undefined;
    }

    this.emit('reconnecting');
    this.#connect().catch(() => {
      // the error was already emitted, silently ignore it
      this.#isReconnecting = false;
    });
  }

  write(iterable: Iterable<ReadonlyArray<RedisArgument>>) {
    if (!this.#socket) return;

    this.#socket.cork();
    for (const args of iterable) {
      for (const toWrite of args) {
        this.#socket.write(toWrite);
      }

      if (this.#socket.writableNeedDrain) break;
    }
    this.#socket.uncork();
  }

  async quit<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.#isOpen) {
      throw new ClientClosedError();
    }

    this.#isOpen = false;
    const reply = await fn();
    this.destroySocket();
    return reply;
  }

  close() {
    if (!this.#isOpen) {
      throw new ClientClosedError();
    }

    this.#isOpen = false;
  }

  destroy() {
    if (!this.#isOpen) {
      throw new ClientClosedError();
    }

    this.#isOpen = false;
    this.destroySocket();
  }

  destroySocket() {
    this.#isReady = false;
    this.#isReconnecting = false;

    if (this.#socket) {
      this.#socket.destroy();
      this.#socket = undefined;
    }

    this.emit('end');
  }

  ref() {
    this.#isSocketUnrefed = false;
    this.#socket?.ref();
  }

  unref() {
    this.#isSocketUnrefed = true;
    this.#socket?.unref();
  }

  defaultReconnectStrategy(retries: number, cause: unknown) {
    // By default, do not reconnect on socket timeout.
    if (cause instanceof SocketTimeoutError) {
      return false;
    }

    // Generate a random jitter between 0 – 200 ms:
    const jitter = Math.floor(Math.random() * 200);
    // Delay is an exponential back off, (times^2) * 50 ms, with a maximum value of 2000 ms:
    const delay = Math.min(Math.pow(2, retries) * 50, 2000);

    return delay + jitter;
  }
}
