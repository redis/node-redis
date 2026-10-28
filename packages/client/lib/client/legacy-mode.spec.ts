import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { promisify } from 'node:util';
import { RedisLegacyClientType } from './legacy-mode';
import { ErrorReply } from '../errors';
import { RedisClientType } from '.';
import { once } from 'node:events';

function testWithLegacyClient(title: string, fn: (legacy: RedisLegacyClientType, client: RedisClientType) => Promise<unknown>) {
  testUtils.testWithClient(title, client => fn(client.legacy(), client), GLOBAL.SERVERS.OPEN);
}

// Regression: the callback ran inside a .then whose rejection the next .catch passed back to the
// same callback, so a callback that threw was called a second time with its own error.
async function callsOfThrowingCallback(run: (callback: (err: ErrorReply | null, reply?: unknown) => void) => void) {
  const calls: Array<[ErrorReply | null, unknown]> = [],
    thrown = new Error('thrown by the callback');
  let unhandled: unknown;
  const onUnhandled = (reason: unknown) => { unhandled = reason; };
  process.on('unhandledRejection', onUnhandled);
  try {
    await new Promise<void>(resolve => run((err, reply) => {
      calls.push([err, reply]);
      resolve();
      throw thrown;
    }));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(unhandled, thrown, 'the callback error must surface as an unhandled rejection');
  } finally {
    process.removeListener('unhandledRejection', onUnhandled);
  }

  return calls;
}

describe('Legacy Mode', () => {
  describe('client.sendCommand', () => {
    testWithLegacyClient('resolve', async client => {
      assert.equal(
        await promisify(client.sendCommand).call(client, 'PING'),
        'PONG'
      );
    });

    testWithLegacyClient('reject', async client => {
      await assert.rejects(
        promisify(client.sendCommand).call(client, 'ERROR'),
        ErrorReply
      );
    });

    testWithLegacyClient('reject without a callback', async (legacy, client) => {
      legacy.sendCommand('ERROR');
      const [err] = await once(client, 'error');
      assert.ok(err instanceof ErrorReply);
    });

    testWithLegacyClient('does not call back again when the callback throws', async legacy => {
      assert.deepEqual(
        await callsOfThrowingCallback(callback => legacy.sendCommand('PING', callback)),
        [[null, 'PONG']]
      );
    });
  });

  describe('hGetAll (TRANSFORM_LEGACY_REPLY)', () => {
    testWithLegacyClient('resolve', async client => {
      await promisify(client.hSet).call(client, 'key', 'field', 'value');
      assert.deepEqual(
        await promisify(client.hGetAll).call(client, 'key'),
        Object.defineProperties({}, {
          field: {
            value: 'value',
            configurable: true,
            enumerable: true
          }
        })
      );
    });

    testWithLegacyClient('reject', async client => {
      await assert.rejects(
        promisify(client.hGetAll).call(client),
        ErrorReply
      );
    });
  });

  describe('client.set', () => {
    testWithLegacyClient('vardict', async client => {
      assert.equal(
        await promisify(client.set).call(client, 'a', 'b'),
        'OK'
      );
    });

    testWithLegacyClient('array', async client => {
      assert.equal(
        await promisify(client.set).call(client, ['a', 'b']),
        'OK'
      );
    });

    testWithLegacyClient('vardict & arrays', async client => {
      assert.equal(
        await promisify(client.set).call(client, ['a'], 'b', ['EX', 1]),
        'OK'
      );
    });

    testWithLegacyClient('reject without a callback', async (legacy, client) => {
      legacy.set('ERROR');
      const [err] = await once(client, 'error');
      assert.ok(err instanceof ErrorReply);
    });

    testWithLegacyClient('does not call back again when the callback throws', async legacy => {
      assert.deepEqual(
        await callsOfThrowingCallback(callback => legacy.set('key', 'value', callback)),
        [[null, 'OK']]
      );
    });
  });

  describe('client.quit', () => {
    testWithLegacyClient('closes the client without reconnecting', async (legacy, client) => {
      let reconnecting = 0;
      client.on('reconnecting', () => reconnecting++);

      await new Promise<void>((resolve, reject) => {
        legacy.flushAll((err) => {
          if (err) return reject(err);

          legacy.set('key', 'value', err => {
            if (err) return reject(err);

            legacy.quit((err, reply) => {
              if (err) return reject(err);
              assert.equal(reply, 'OK');
              resolve();
            });
          });
        });
      });

      assert.equal(client.isOpen, false);
      assert.equal(reconnecting, 0);
    });

    testWithLegacyClient('does not call back again when the callback throws', async legacy => {
      assert.deepEqual(
        await callsOfThrowingCallback(callback => legacy.quit(callback)),
        [[null, 'OK']]
      );
    });
  });

  describe('client.multi', () => {
    testWithLegacyClient('resolve', async client => {
      const multi = client.multi().ping().sendCommand('PING');
      assert.deepEqual(
        await promisify(multi.exec).call(multi),
        ['PONG', 'PONG']
      );
    });

    testWithLegacyClient('reject', async client => {
      const multi = client.multi().sendCommand('ERROR');
      await assert.rejects(
        promisify(multi.exec).call(multi),
        ErrorReply
      );
    });

    testWithLegacyClient('reject without a callback', async (legacy, client) => {
      legacy.multi().sendCommand('ERROR').exec();
      const [err] = await once(client, 'error');
      assert.ok(err instanceof ErrorReply);
    });

    testWithLegacyClient('does not call back again when the callback throws', async legacy => {
      const multi = legacy.multi().ping();
      assert.deepEqual(
        await callsOfThrowingCallback(callback => multi.exec(callback)),
        [[null, ['PONG']]]
      );
    });
  });
});
