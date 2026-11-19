import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import SCAN from './SCAN';

describe('SCAN', () => {
  describe('transformArguments', () => {
    it('cusror only', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0'),
        ['SCAN', '0']
      );
    });

    it('with MATCH', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', {
          MATCH: 'pattern'
        }),
        ['SCAN', '0', 'MATCH', 'pattern']
      );
    });

    it('with an empty MATCH', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', { MATCH: '' }),
        ['SCAN', '0', 'MATCH', '']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', {
          COUNT: 1
        }),
        ['SCAN', '0', 'COUNT', '1']
      );
    });

    it('with TYPE', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', {
          TYPE: 'stream'
        }),
        ['SCAN', '0', 'TYPE', 'stream']
      );
    });

    it('with an empty TYPE', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', { TYPE: '' }),
        ['SCAN', '0', 'TYPE', '']
      );
    });

    it('with an empty Buffer TYPE', () => {
      const type = Buffer.alloc(0);
      assert.deepEqual(
        parseArgs(SCAN, '0', { TYPE: type }),
        ['SCAN', '0', 'TYPE', type]
      );
    });

    it('omits an undefined TYPE', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', { TYPE: undefined }),
        ['SCAN', '0']
      );
    });

    it('preserves an empty TYPE with MATCH and COUNT', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', { MATCH: 'key:*', COUNT: 10, TYPE: '' }),
        ['SCAN', '0', 'MATCH', 'key:*', 'COUNT', '10', 'TYPE', '']
      );
    });

    it('with MATCH & COUNT & TYPE', () => {
      assert.deepEqual(
        parseArgs(SCAN, '0', {
          MATCH: 'pattern',
          COUNT: 1,
          TYPE: 'stream'
        }),
        ['SCAN', '0', 'MATCH', 'pattern', 'COUNT', '1', 'TYPE', 'stream']
      );
    });
  });

  describe('client.scan', () => {
    testUtils.testWithClient('without a type filter', async client => {
      assert.deepEqual(
        await client.scan('0'),
        {
          cursor: '0',
          keys: []
        }
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('preserves empty TYPE filters', async client => {
      await client.set('scan-type-check', 'value');
      for (const TYPE of ['', Buffer.alloc(0)]) {
        assert.deepEqual((await client.scan('0', { TYPE })).keys, []);
        const keys = [];
        for await (const page of client.scanIterator({ TYPE })) {
          keys.push(...page);
        }
        assert.deepEqual(keys, []);
      }
    }, GLOBAL.SERVERS.OPEN);
  });
});
