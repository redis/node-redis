import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import XADD_NOMKSTREAM from './XADD_NOMKSTREAM';

describe('XADD NOMKSTREAM', () => {
  describe('transformArguments', () => {
    it('single field', () => {
      assert.deepEqual(
        XADD_NOMKSTREAM.transformArguments('key', '*', {
          field: 'value'
        }),
        ['XADD', 'key', '*', 'field', 'value', 'NOMKSTREAM']
      );
    });

    it('multiple fields', () => {
      assert.deepEqual(
        XADD_NOMKSTREAM.transformArguments('key', '*', {
          '1': 'I',
          '2': 'II'
        }),
        ['XADD', 'key', '*', '1', 'I', '2', 'II', 'NOMKSTREAM']
      );
    });

    it('with TRIM', () => {
      assert.deepEqual(
        XADD_NOMKSTREAM.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000
          }
        }),
        ['XADD', 'key', '1000', '*', 'field', 'value', 'NOMKSTREAM']
      );
    });

    it('with TRIM.strategy', () => {
      assert.deepEqual(
        XADD_NOMKSTREAM.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            strategy: 'MAXLEN',
            threshold: 1000
          }
        }),
        ['XADD', 'key', 'MAXLEN', '1000', '*', 'field', 'value', 'NOMKSTREAM']
      );
    });

    it('with TRIM.strategyModifier', () => {
      assert.deepEqual(
        XADD_NOMKSTREAM.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            strategyModifier: '=',
            threshold: 1000
          }
        }),
        ['XADD', 'key', '=', '1000', '*', 'field', 'value', 'NOMKSTREAM']
      );
    });

    it('with TRIM.limit', () => {
      assert.deepEqual(
        XADD_NOMKSTREAM.transformArguments('key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000,
            limit: 1
          }
        }),
        ['XADD', 'key', '1000', 'LIMIT', '1', '*', 'field', 'value', 'NOMKSTREAM']
      );
    });
  });

  testUtils.testAll('xAddNoMkStream', async client => {
    assert.equal(
      typeof await client.xAddNoMkStream('key', '*', {
        field: 'value'
      }),
      'string'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
