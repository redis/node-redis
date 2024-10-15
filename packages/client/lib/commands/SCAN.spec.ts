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

  testUtils.testWithClient('client.scan', async client => {
    assert.deepEqual(
      await client.scan('0'),
      {
        cursor: '0',
        keys: []
      }
    );
  }, GLOBAL.SERVERS.OPEN);
});
