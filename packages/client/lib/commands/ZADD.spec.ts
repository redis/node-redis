import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZADD from './ZADD';
import { parseArgs } from './generic-transformers';

describe('ZADD', () => {
  describe('transformArguments', () => {
    it('single member', () => {
      assert.deepEqual(
        parseArgs(ZADD, 'key', {
          value: '1',
          score: 1
        }),
        ['ZADD', 'key', '1', '1']
      );
    });

    it('multiple members', () => {
      assert.deepEqual(
        parseArgs(ZADD, 'key', [{
          value: '1',
          score: 1
        }, {
          value: '2',
          score: 2
        }]),
        ['ZADD', 'key', '1', '1', '2', '2']
      );
    });

    describe('with condition', () => {
      it('condition property', () => {
        assert.deepEqual(
          parseArgs(ZADD, 'key', {
            value: '1',
            score: 1
          }, {
            condition: 'NX'
          }),
          ['ZADD', 'key', 'NX', '1', '1']
        );
      });

      it('with NX (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(ZADD, 'key', {
            value: '1',
            score: 1
          }, {
            NX: true
          }),
          ['ZADD', 'key', 'NX', '1', '1']
        );
      });

      it('with XX (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(ZADD, 'key', {
            value: '1',
            score: 1
          }, {
            XX: true
          }),
          ['ZADD', 'key', 'XX', '1', '1']
        );
      });
    });

    describe('with comparison', () => {
      it('with LT', () => {
        assert.deepEqual(
          parseArgs(ZADD, 'key', {
            value: '1',
            score: 1
          }, {
            comparison: 'LT'
          }),
          ['ZADD', 'key', 'LT', '1', '1']
        );
      });

      it('with LT (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(ZADD, 'key', {
            value: '1',
            score: 1
          }, {
            LT: true
          }),
          ['ZADD', 'key', 'LT', '1', '1']
        );
      });

      it('with GT (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(ZADD, 'key', {
            value: '1',
            score: 1
          }, {
            GT: true
          }),
          ['ZADD', 'key', 'GT', '1', '1']
        );
      });
    });    

    it('with CH', () => {
      assert.deepEqual(
        parseArgs(ZADD, 'key', {
          value: '1',
          score: 1
        }, {
          CH: true
        }),
        ['ZADD', 'key', 'CH', '1', '1']
      );
    });

    it('with condition, comparison, CH', () => {
      assert.deepEqual(
        parseArgs(ZADD, 'key', {
          value: '1',
          score: 1
        }, {
          condition: 'XX',
          comparison: 'LT',
          CH: true
        }),
        ['ZADD', 'key', 'XX', 'LT', 'CH', '1', '1']
      );
    });
  });

  testUtils.testAll('zAdd', async client => {
    assert.equal(
      await client.zAdd('key', {
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
