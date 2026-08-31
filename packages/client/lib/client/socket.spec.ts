import { strict as assert } from 'node:assert';
import { spy } from 'sinon';
import { once } from 'node:events';
import net from 'node:net';
import RedisSocket, { RedisSocketOptions } from './socket';
import testUtils, { GLOBAL } from '../test-utils';
import { setTimeout } from 'timers/promises';
import { ReconnectStrategyError } from '../errors';

describe('Socket', () => {
  const CLIENT_ID = 'test-client-id';

  function createSocket(options: RedisSocketOptions): RedisSocket {
    const socket = new RedisSocket(() => Promise.resolve(), CLIENT_ID, options);

    socket.on('error', () => {
      // ignore errors
    });

    return socket;
  }

  describe('reconnectStrategy', () => {
    it('false', async () => {
      const socket = createSocket({
        host: 'error',
        connectTimeout: 1,
        reconnectStrategy: false
      });

      await assert.rejects(socket.connect());

      assert.equal(socket.isOpen, false);
    });

    it('0', async () => {
      const socket = createSocket({
        host: 'error',
        connectTimeout: 1,
        reconnectStrategy: 0
      });

      socket.connect();
      await once(socket, 'error');
      assert.equal(socket.isOpen, true);
      assert.equal(socket.isReady, false);
      socket.destroy();
      assert.equal(socket.isOpen, false);
    });

    it('custom strategy', async () => {
      const numberOfRetries = 3;

      const reconnectStrategy = spy((retries: number) => {
        assert.equal(retries + 1, reconnectStrategy.callCount);

        if (retries === numberOfRetries) return new Error(`${numberOfRetries}`);

        return 0;
      });

      const socket = createSocket({
        host: 'error',
        connectTimeout: 1,
        reconnectStrategy
      });

      await assert.rejects(socket.connect(), {
        message: `${numberOfRetries}`
      });

      assert.equal(socket.isOpen, false);
    });

    it('should handle errors', async () => {
      const socket = createSocket({
        host: 'error',
        connectTimeout: 1,
        reconnectStrategy(retries: number) {
          if (retries === 1) return new Error('done');
          throw new Error();
        }
      });

      await assert.rejects(socket.connect());

      assert.equal(socket.isOpen, false);
    });
  });

  describe('terminated event (#2948)', () => {
    it('should emit `terminated` when reconnectStrategy gives up on the initial connection', async () => {
      const socket = createSocket({
        host: 'error',
        connectTimeout: 1,
        reconnectStrategy: false
      });

      const events: string[] = [];
      let terminatedCause: Error | undefined;
      socket.on('terminated', cause => {
        events.push('terminated');
        terminatedCause = cause;
      });
      socket.on('error', () => events.push('error'));

      await assert.rejects(socket.connect());

      assert.ok(terminatedCause instanceof Error);
      assert.deepEqual(events.slice(-2), ['terminated', 'error']);
      assert.equal(socket.isOpen, false);
    });

    it('should emit `terminated` with the wrapped error when a custom reconnectStrategy gives up', async () => {
      const reconnectStrategy = spy((retries: number) => {
        if (retries === 1) return new Error('done');
        return 0;
      });

      const socket = createSocket({
        host: 'error',
        connectTimeout: 1,
        reconnectStrategy
      });

      const events: string[] = [];
      let terminatedCause: Error | undefined;
      socket.on('terminated', cause => {
        events.push('terminated');
        terminatedCause = cause;
      });
      socket.on('error', () => events.push('error'));

      await assert.rejects(socket.connect());

      assert.ok(terminatedCause instanceof ReconnectStrategyError, 'terminated cause should be a ReconnectStrategyError');
      assert.deepEqual(events.slice(-2), ['terminated', 'error']);
    });

    it('should emit `terminated` — not just `error` — when the connection is lost after being ready', async () => {
      // This is the scenario from #2948: `error` fires on *every* disconnect,
      // including ones the client is about to retry, so a listener can't tell
      // "still retrying" apart from "reconnectStrategy gave up, this client
      // is dead". Before this fix, losing an already-ready connection only
      // ever emitted `error`, indistinguishable from a transient one.
      const connections: net.Socket[] = [];
      const server = net.createServer(conn => {
        conn.on('error', () => { /* ignore */ });
        connections.push(conn);
      });
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as net.AddressInfo;
      const firstConnection = once(server, 'connection') as Promise<[net.Socket]>;

      try {
        const socket = createSocket({
          host: '127.0.0.1',
          port,
          // Give up as soon as the live connection dies, instead of retrying.
          reconnectStrategy: false
        });

        await socket.connect();
        assert.equal(socket.isReady, true, 'socket.isReady');

        const terminatedCauses: Error[] = [];
        socket.on('terminated', cause => terminatedCauses.push(cause));

        const [conn] = await firstConnection;
        conn.destroy();
        const [errCause] = await once(socket, 'error') as [Error];

        assert.equal(terminatedCauses.length, 1, 'terminated should have fired exactly once');
        assert.equal(terminatedCauses[0], errCause, 'terminated should carry the same cause as error');
        assert.equal(socket.isOpen, false, 'socket.isOpen');
      } finally {
        for (const conn of connections) conn.destroy();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });

    it('should not emit `terminated` when the reconnectStrategy schedules a retry', async () => {
      const socket = createSocket({
        host: 'error',
        connectTimeout: 1,
        reconnectStrategy: 0
      });

      let terminatedCount = 0;
      socket.on('terminated', () => terminatedCount++);

      socket.connect();
      await once(socket, 'error');
      assert.equal(socket.isOpen, true);
      assert.equal(terminatedCount, 0, 'terminated must not fire while still retrying');

      socket.destroy();
    });
  });

  describe('initiator interruption (#3346)', () => {
    it('should keep retrying when the socket dies while the initiator is suspended', async () => {
      const connections: net.Socket[] = [];
      const server = net.createServer(conn => {
        conn.on('error', () => { /* ignore */ });
        connections.push(conn);
      });
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as net.AddressInfo;
      const firstConnection = once(server, 'connection') as Promise<[net.Socket]>;

      try {
        let attempts = 0;
        const socket = new RedisSocket(() => {
          attempts += 1;
          if (attempts === 1) {
            // Simulate an initiator suspended on async work (DNS resolution,
            // credentials provider) when the server drops the connection: the
            // returned promise never settles on its own, just like handshake
            // commands enqueued after the socket already died.
            firstConnection.then(([conn]) => conn.destroy());
            return new Promise(() => { /* never settles */ });
          }
          return Promise.resolve();
        }, CLIENT_ID, {
          host: '127.0.0.1',
          port,
          reconnectStrategy: 0
        });

        const events: string[] = [];
        for (const event of ['error', 'reconnecting', 'ready'] as const) {
          socket.on(event, () => events.push(event));
        }
        socket.on('error', () => { /* ignore */ });

        // Without the in-flight failure guard this never resolves: the retry
        // loop stays suspended inside the abandoned initiator forever.
        await socket.connect();

        assert.equal(attempts, 2, 'initiator must run again on the new socket');
        assert.equal(socket.isReady, true, 'socket.isReady');
        assert.ok(events.includes('reconnecting'), 'must emit reconnecting');

        socket.destroy();
      } finally {
        for (const conn of connections) conn.destroy();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });

    it('should retry (not crash) when the initiator throws synchronously', async () => {
      const server = net.createServer();
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as net.AddressInfo;

      // A synchronous throw must be routed through the socket-death race and
      // turned into a rejected attempt. If it escapes #initiateWhileSocketAlive
      // before the race is built, the socketDied listeners leak and the reject
      // they fire on the subsequent destroy() surfaces as an unhandled rejection.
      const unhandled: unknown[] = [];
      const onUnhandled = (reason: unknown) => unhandled.push(reason);
      process.on('unhandledRejection', onUnhandled);

      try {
        let attempts = 0;
        const socket = new RedisSocket(() => {
          attempts += 1;
          if (attempts === 1) throw new Error('sync initiator failure');
          return Promise.resolve();
        }, CLIENT_ID, {
          host: '127.0.0.1',
          port,
          reconnectStrategy: 0
        });
        socket.on('error', () => { /* ignore */ });

        await socket.connect();

        assert.equal(attempts, 2, 'initiator must run again after a synchronous throw');
        assert.equal(socket.isReady, true, 'socket.isReady');

        socket.destroy();
        // let any leaked listener / stray rejection settle before asserting
        await setTimeout(0);
        assert.deepEqual(unhandled, [], 'must not produce an unhandled rejection');
      } finally {
        process.removeListener('unhandledRejection', onUnhandled);
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });

    it('should not emit error/reconnecting when destroyed while the initiator is suspended', async () => {
      const connections: net.Socket[] = [];
      const server = net.createServer(conn => {
        conn.on('error', () => { /* ignore */ });
        connections.push(conn);
      });
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as net.AddressInfo;

      try {
        let suspended!: () => void;
        const initiatorSuspended = new Promise<void>(resolve => { suspended = resolve; });
        const socket = new RedisSocket(() => {
          // Suspend forever so the destroy() below races an in-flight initiator.
          suspended();
          return new Promise(() => { /* never settles */ });
        }, CLIENT_ID, {
          host: '127.0.0.1',
          port,
          reconnectStrategy: 0
        });

        const events: string[] = [];
        for (const event of ['error', 'reconnecting'] as const) {
          socket.on(event, () => events.push(event));
        }
        socket.on('error', () => { /* ignore */ });

        const connectPromise = socket.connect();
        await initiatorSuspended;
        socket.destroy();

        await assert.rejects(connectPromise);
        assert.deepEqual(events, [], 'must not emit error/reconnecting on intentional destroy');
        assert.equal(socket.isOpen, false, 'socket.isOpen');
      } finally {
        for (const conn of connections) conn.destroy();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });
  });

  describe('write', () => {
    function captureUnderlyingSocket() {
      const original = net.createConnection;
      const captured: { socket?: net.Socket } = {};
      const target = net as unknown as { createConnection: unknown };
      target.createConnection = (...args: unknown[]) => {
        const s = (original as unknown as (...a: unknown[]) => net.Socket).apply(net, args);
        captured.socket = s;
        return s;
      };
      return {
        captured,
        restore() {
          target.createConnection = original;
        }
      };
    }

    async function withConnectedSocket(
      fn: (socket: RedisSocket, underlying: net.Socket) => Promise<void>
    ) {
      const server = net.createServer();
      server.on('connection', conn => conn.on('error', () => { /* ignore */ }));
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as net.AddressInfo;

      const capture = captureUnderlyingSocket();
      try {
        const socket = createSocket({
          host: '127.0.0.1',
          port,
          reconnectStrategy: false
        });

        await socket.connect();
        assert.ok(capture.captured.socket, 'captured underlying socket');

        try {
          await fn(socket, capture.captured.socket!);
        } finally {
          // Tear down the connection so server.close() doesn't wait for it.
          capture.captured.socket?.destroy();
        }
      } finally {
        capture.restore();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    }

    it('should short-circuit when the underlying socket is no longer writable (#3282)', async () => {
      await withConnectedSocket(async (socket, underlying) => {
        Object.defineProperty(underlying, 'writable', {
          value: false,
          configurable: true
        });

        const writeSpy = spy(underlying, 'write');
        socket.write([[Buffer.from('PING\r\n')]]);
        assert.equal(writeSpy.callCount, 0, 'must not call write on a non-writable socket');
      });
    });

    it('should swallow synchronous EPIPE from net.Socket.write (#3282)', async () => {
      await withConnectedSocket(async (socket, underlying) => {
        underlying.write = (() => {
          const err: NodeJS.ErrnoException = new Error('write EPIPE');
          err.code = 'EPIPE';
          throw err;
        }) as net.Socket['write'];

        assert.doesNotThrow(() =>
          socket.write([[Buffer.from('PING\r\n')]])
        );
      });
    });

    it('should rethrow non-EPIPE errors from net.Socket.write', async () => {
      await withConnectedSocket(async (socket, underlying) => {
        underlying.write = (() => {
          throw new Error('boom');
        }) as net.Socket['write'];

        assert.throws(
          () => socket.write([[Buffer.from('PING\r\n')]]),
          /boom/
        );
      });
    });
  });

  describe('stale data after socket error (#3209)', () => {
    it('should not forward data events emitted on the old socket after an error', async () => {
      const server = net.createServer();
      server.on('connection', conn => conn.on('error', () => {}));
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as net.AddressInfo;

      const original = net.createConnection;
      const captured: { socket?: net.Socket } = {};
      const target = net as unknown as { createConnection: unknown };
      target.createConnection = (...args: unknown[]) => {
        const s = (original as unknown as (...a: unknown[]) => net.Socket).apply(net, args);
        captured.socket = s;
        return s;
      };

      try {
        const socket = createSocket({ host: '127.0.0.1', port, reconnectStrategy: false });
        await socket.connect();

        const underlying = captured.socket!;
        assert.ok(underlying, 'captured underlying socket');

        const staleData: Buffer[] = [];
        socket.on('data', data => staleData.push(data));

        // Simulate a socket error — triggers #onSocketError which removes the
        // 'data' listener from the old socket before destroying it
        underlying.emit('error', new Error('connection reset'));

        // Simulate buffered data arriving after the error (the race this fix targets)
        underlying.emit('data', Buffer.from('+STALE\r\n'));

        assert.equal(staleData.length, 0, 'stale data after socket error must not be forwarded');
      } finally {
        target.createConnection = original;
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });
  });

  describe('keepAliveInitialDelay default', () => {
    function captureConnectOptions() {
      const original = net.createConnection;
      const captured: { options?: net.TcpNetConnectOpts } = {};
      const target = net as unknown as { createConnection: unknown };
      target.createConnection = (...args: unknown[]) => {
        captured.options = args[0] as net.TcpNetConnectOpts;
        return (original as unknown as (...a: unknown[]) => net.Socket).apply(net, args);
      };
      return {
        captured,
        restore() {
          target.createConnection = original;
        }
      };
    }

    async function withCapturedConnect(
      socketOptions: Partial<RedisSocketOptions>,
      fn: (options: net.TcpNetConnectOpts) => void
    ) {
      const server = net.createServer();
      server.on('connection', conn => conn.on('error', () => { /* ignore */ }));
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as net.AddressInfo;

      const capture = captureConnectOptions();
      try {
        const socket = createSocket({
          host: '127.0.0.1',
          port,
          reconnectStrategy: false,
          ...socketOptions
        });
        await socket.connect();
        try {
          assert.ok(capture.captured.options, 'captured connect options');
          fn(capture.captured.options!);
        } finally {
          socket.destroy();
        }
      } finally {
        capture.restore();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    }

    it('passes keepAliveInitialDelay: 30000 to net.createConnection by default', async () => {
      await withCapturedConnect({}, options => {
        // @ts-expect-error - @types/node omits keepAliveInitialDelay
        assert.equal(options.keepAliveInitialDelay, 30000);
      });
    });

    it('forwards a user-supplied keepAliveInitialDelay verbatim', async () => {
      await withCapturedConnect({ keepAliveInitialDelay: 1234 }, options => {
        // @ts-expect-error - @types/node omits keepAliveInitialDelay
        assert.equal(options.keepAliveInitialDelay, 1234);
      });
    });
  });

  describe('socketTimeout', () => {
    const timeout = 200;
    testUtils.testWithClient(
      'should timeout with positive socketTimeout values',
      async client => {
        // Attach a permanent error listener before connecting so the timeout
        // event can never surface as an uncaught error — neither during the
        // handshake nor in the idle window afterwards. `reconnectStrategy:
        // false` makes the run deterministic and causes the client to emit
        // `error` twice, so a permanent listener (not `once`) is required.
        client.on('error', () => {
          // keep a permanent listener for any later error emission
        });
        const firstError = once(client, 'error') as Promise<[Error]>;

        try {
          await client.connect();
          assert.equal(client.isReady, true, 'client.isReady');
          assert.equal(client.isOpen, true, 'client.isOpen');

          const [err] = await firstError;
          assert.equal(
            err.message,
            `Socket timeout timeout. Expecting data, but didn't receive any in ${timeout}ms.`
          );
          assert.equal(client.isReady, false, 'client.isReady');
          // `reconnectStrategy: false` closes the client synchronously after
          // emitting the error.
          assert.equal(client.isOpen, false, 'client.isOpen');
        } finally {
          if (client.isOpen) client.destroy();
        }
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        disableClientSetup: true,
        clientOptions: {
          socket: {
            socketTimeout: timeout,
            reconnectStrategy: false
          }
        }
      }
    );

    testUtils.testWithClient(
      'should not timeout with undefined socketTimeout',
      async client => {

        assert.equal(client.isReady, true, 'client.isReady');
        assert.equal(client.isOpen, true, 'client.isOpen');

        client.on('error', _err => {
          assert.fail('Should not have timed out or errored in any way');
        });
        await setTimeout(100);
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: {
          socket: {
            socketTimeout: undefined
          }
        }
      }
    );
  });
});
