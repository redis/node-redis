import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XADD from './XADD';
import { parseArgs } from './generic-transformers';
import { STREAM_DELETION_POLICY } from './common-stream.types';

describe('XADD', () => {
  describe('transformArguments', () => {
    it('single field', () => {
      assert.deepEqual(
        parseArgs(XADD, 'key', '*', {
          field: 'value'
        }),
        ['XADD', 'key', '*', 'field', 'value']
      );
    });

    it('multiple fields', () => {
      assert.deepEqual(
        parseArgs(XADD, 'key', '*', {
          '1': 'I',
          '2': 'II'
        }),
        ['XADD', 'key', '*', '1', 'I', '2', 'II']
      );
    });

    it('with TRIM', () => {
      assert.deepEqual(
        parseArgs(XADD, 'key', '*', {
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
        parseArgs(XADD, 'key', '*', {
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
        parseArgs(XADD, 'key', '*', {
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
        parseArgs(XADD, 'key', '*', {
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

    it('with TRIM.policy', () => {
      assert.deepEqual(
        parseArgs(XADD, 'key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000,
            policy: STREAM_DELETION_POLICY.DELREF
          }
        }),
        ['XADD', 'key', '1000', 'DELREF', '*', 'field', 'value']
      );
    });

    it('with all TRIM options', () => {
      assert.deepEqual(
        parseArgs(XADD, 'key', '*', {
          field: 'value'
        }, {
          TRIM: {
            strategy: 'MAXLEN',
            strategyModifier: '~',
            threshold: 1000,
            limit: 100,
            policy: STREAM_DELETION_POLICY.ACKED
          }
        }),
        ['XADD', 'key', 'MAXLEN', '~', '1000', 'LIMIT', '100', 'ACKED', '*', 'field', 'value']
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

  testUtils.testAll(
    'xAdd with TRIM policy',
    async (client) => {
      assert.equal(
        typeof await client.xAdd('{tag}key', '*', 
          { field: 'value' },
          {
            TRIM: {
              strategy: 'MAXLEN',
              threshold: 1000,
              policy: STREAM_DELETION_POLICY.KEEPREF
            }
          }
        ),
        'string'
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    'xAdd with all TRIM options',
    async (client) => {
      assert.equal(
        typeof await client.xAdd('{tag}key2', '*', 
          { field: 'value' },
          {
            TRIM: {
              strategy: 'MAXLEN',
              strategyModifier: '~',
              threshold: 1000,
              limit: 10,
              policy: STREAM_DELETION_POLICY.DELREF
            }
          }
        ),
        'string'
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );
});
