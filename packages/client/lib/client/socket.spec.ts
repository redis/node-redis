import { strict as assert } from 'node:assert';
import { spy } from 'sinon';
import { once } from 'node:events';
import net from 'node:net';
import RedisSocket, { RedisSocketOptions } from './socket';
import testUtils, { GLOBAL } from '../test-utils';
import { setTimeout } from 'timers/promises';

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

  describe('write', () => {
    function captureUnderlyingSocket() {
      const original = net.createConnection;
      const captured: { socket?: net.Socket } = {};
      (net as any).createConnection = (...args: any[]) => {
        const s = (original as any).apply(net, args);
        captured.socket = s;
        return s;
      };
      return {
        captured,
        restore() {
          (net as any).createConnection = original;
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

        await fn(socket, capture.captured.socket!);
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

  describe('socketTimeout', () => {
    const timeout = 50;
    testUtils.testWithClient(
      'should timeout with positive socketTimeout values',
      async client => {
        let timedOut = false;

        assert.equal(client.isReady, true, 'client.isReady');
        assert.equal(client.isOpen, true, 'client.isOpen');

        client.on('error', err => {
          assert.equal(
            err.message,
            `Socket timeout timeout. Expecting data, but didn't receive any in ${timeout}ms.`
          );

          assert.equal(client.isReady, false, 'client.isReady');

          // This is actually a bug with the onSocketError implementation,
          // the client should be closed before the error is emitted
          process.nextTick(() => {
            assert.equal(client.isOpen, false, 'client.isOpen');
          });

          timedOut = true;
        });
        await setTimeout(timeout * 2);
        if (!timedOut) assert.fail('Should have timed out by now');
      },
      {
        ...GLOBAL.SERVERS.OPEN,
        clientOptions: {
          socket: {
            socketTimeout: timeout
          }
        }
      }
    );

    testUtils.testWithClient(
      'should not timeout with undefined socketTimeout',
      async client => {

        assert.equal(client.isReady, true, 'client.isReady');
        assert.equal(client.isOpen, true, 'client.isOpen');

        client.on('error', err => {
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
