import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XADD from './XADD';

describe('XADD', () => {
  describe('transformArguments', () => {
    it('single field', () => {
      assert.deepEqual(
        XADD.transformArguments('key', '*', {
          field: 'value'
        }),
        ['XADD', 'key', '*', 'field', 'value']
      );
    });

    it('multiple fields', () => {
      assert.deepEqual(
        XADD.transformArguments('key', '*', {
          '1': 'I',
          '2': 'II'
        }),
        ['XADD', 'key', '*', '1', 'I', '2', 'II']
      );
    });

    it('with TRIM', () => {
      assert.deepEqual(
        XADD.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000
          }
        }),
        ['XADD', 'key', '1000', '*', 'field', 'value']
      );
    });

    it('with TRIM.strategy', () => {
      assert.deepEqual(
        XADD.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            strategy: 'MAXLEN',
            threshold: 1000
          }
        }),
        ['XADD', 'key', 'MAXLEN', '1000', '*', 'field', 'value']
      );
    });

    it('with TRIM.strategyModifier', () => {
      assert.deepEqual(
        XADD.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            strategyModifier: '=',
            threshold: 1000
          }
        }),
        ['XADD', 'key', '=', '1000', '*', 'field', 'value']
      );
    });

    it('with TRIM.limit', () => {
      assert.deepEqual(
        XADD.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000,
            limit: 1
          }
        }),
        ['XADD', 'key', '1000', 'LIMIT', '1', '*', 'field', 'value']
      );
    });
  });

  testUtils.testAll('xAdd', async client => {
    assert.equal(
      typeof await client.xAdd('key', '*', {
        field: 'value'
      }),
      'string'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
