import { strict as assert } from 'node:assert';
import { spy } from 'sinon';
import { once } from 'node:events';
import RedisSocket, { RedisSocketOptions } from './socket';
import testUtils, { GLOBAL } from '../test-utils';
import { setTimeout } from 'timers/promises';

describe('Socket', () => {
  function createSocket(options: RedisSocketOptions): RedisSocket {
    const socket = new RedisSocket(() => Promise.resolve(), options);

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
