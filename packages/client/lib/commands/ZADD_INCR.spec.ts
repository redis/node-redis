import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZADD_INCR from './ZADD_INCR';
import { parseArgs } from './generic-transformers';

describe('ZADD INCR', () => {
  describe('transformArguments', () => {
    it('single member', () => {
      assert.deepEqual(
        parseArgs(ZADD_INCR, 'key', {
          value: '1',
          score: 1
        }),
        ['ZADD', 'key', 'INCR', '1', '1']
      );
    });

    it('multiple members', () => {
      assert.deepEqual(
        parseArgs(ZADD_INCR, 'key', [{
          value: '1',
          score: 1
        }, {
          value: '2',
          score: 2
        }]),
        ['ZADD', 'key', 'INCR', '1', '1', '2', '2']
      );
    });

    it('with condition', () => {
      assert.deepEqual(
        parseArgs(ZADD_INCR, 'key', {
          value: '1',
          score: 1
        }, {
          condition: 'NX'
        }),
        ['ZADD', 'key', 'NX', 'INCR', '1', '1']
      );
    });

    it('with comparison', () => {
      assert.deepEqual(
        parseArgs(ZADD_INCR, 'key', {
          value: '1',
          score: 1
        }, {
          comparison: 'LT'
        }),
        ['ZADD', 'key', 'LT', 'INCR', '1', '1']
      );
    });    

    it('with CH', () => {
      assert.deepEqual(
        parseArgs(ZADD_INCR, 'key', {
          value: '1',
          score: 1
        }, {
          CH: true
        }),
        ['ZADD', 'key', 'CH', 'INCR', '1', '1']
      );
    });

    it('with condition, comparison, CH', () => {
      assert.deepEqual(
        parseArgs(ZADD_INCR, 'key', {
          value: '1',
          score: 1
        }, {
          condition: 'XX',
          comparison: 'LT',
          CH: true
        }),
        ['ZADD', 'key', 'XX', 'LT', 'CH', 'INCR', '1', '1']
      );
    });
  });

  testUtils.testAll('zAddIncr', async client => {
    assert.equal(
      await client.zAddIncr('key', {
        value: 'a',
        score: 1
      }),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
