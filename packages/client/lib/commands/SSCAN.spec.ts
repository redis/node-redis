import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SSCAN from './SSCAN';
import { parseArgs } from './generic-transformers';

describe('SSCAN', () => {
  describe('transformArguments', () => {
    it('cusror only', () => {
      assert.deepEqual(
        parseArgs(SSCAN, 'key', '0'),
        ['SSCAN', 'key', '0']
      );
    });

    it('with MATCH', () => {
      assert.deepEqual(
        parseArgs(SSCAN, 'key', '0', {
          MATCH: 'pattern'
        }),
        ['SSCAN', 'key', '0', 'MATCH', 'pattern']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(SSCAN, 'key', '0', {
          COUNT: 1
        }),
        ['SSCAN', 'key', '0', 'COUNT', '1']
      );
    });

    it('with MATCH & COUNT', () => {
      assert.deepEqual(
        parseArgs(SSCAN, 'key', '0', {
          MATCH: 'pattern',
          COUNT: 1
        }),
        ['SSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1']
      );
    });
  });

  testUtils.testAll('sScan', async client => {
    assert.deepEqual(
      await client.sScan('key', '0'),
      {
        cursor: '0',
        members: []
      }
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
