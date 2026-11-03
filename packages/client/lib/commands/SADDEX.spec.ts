import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SADDEX from './SADDEX';
import { parseArgs } from './generic-transformers';

describe('SADDEX', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SADDEX, 'key', 'member'),
        ['SADDEX', 'key', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SADDEX, 'key', ['1', '2']),
        ['SADDEX', 'key', 'MEMBERS', '2', '1', '2']
      );
    });

    it('with expiration', () => {
      assert.deepEqual(
        parseArgs(SADDEX, 'key', 'member', {
          expiration: { type: 'PXAT', value: 1000 }
        }),
        ['SADDEX', 'key', 'PXAT', '1000', 'MEMBERS', '1', 'member']
      );
    });

    it('with KEEPTTL', () => {
      assert.deepEqual(
        parseArgs(SADDEX, 'key', 'member', { expiration: 'KEEPTTL' }),
        ['SADDEX', 'key', 'KEEPTTL', 'MEMBERS', '1', 'member']
      );
    });

    it('with mode and expiration', () => {
      assert.deepEqual(
        parseArgs(SADDEX, 'key', 'member', {
          mode: 'MNX',
          expiration: { type: 'EX', value: 60 }
        }),
        ['SADDEX', 'key', 'MNX', 'EX', '60', 'MEMBERS', '1', 'member']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('sAddEx', async client => {
      assert.equal(await client.sAddEx('key', ['a', 'b']), 1);
      assert.equal(await client.sAddEx('key', 'a'), 0);

      assert.equal(
        await client.sAddEx('key', ['a', 'c'], {
          mode: 'MNX',
          expiration: { type: 'EX', value: 60 }
        }),
        0
      );
      assert.equal(
        await client.sAddEx('key', ['a', 'b'], {
          mode: 'MXX',
          expiration: { type: 'EX', value: 60 }
        }),
        1
      );

      assert.equal(await client.sAddEx('key', 'a', { expiration: 'KEEPTTL' }), 0);
      const [ttl] = await client.sTTL('key', 'a');
      assert.ok(ttl > 0 && ttl <= 60);

      assert.equal(
        await client.sAddEx('key', 'b', { expiration: { type: 'EXAT', value: 1 } }),
        1
      );
      assert.deepEqual(await client.sMembers('key'), ['a']);
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
