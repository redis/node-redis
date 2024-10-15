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
  });

  describe('hGetAll (TRANSFORM_LEGACY_REPLY)', () => {  
    testWithLegacyClient('resolve', async client => {
      await promisify(client.hSet).call(client, 'key', 'field', 'value');
      assert.deepEqual(
        await promisify(client.hGetAll).call(client, 'key'),
        Object.create(null, {
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
  });
});
