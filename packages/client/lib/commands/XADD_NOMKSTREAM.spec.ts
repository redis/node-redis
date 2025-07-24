import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XADD_NOMKSTREAM from './XADD_NOMKSTREAM';
import { parseArgs } from './generic-transformers';
import { STREAM_DELETION_POLICY } from './common-stream.types';

describe('XADD NOMKSTREAM', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('single field', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
          field: 'value'
        }),
        ['XADD', 'key', 'NOMKSTREAM', '*', 'field', 'value']
      );
    });

    it('multiple fields', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
          '1': 'I',
          '2': 'II'
        }),
        ['XADD', 'key', 'NOMKSTREAM', '*', '1', 'I', '2', 'II']
      );
    });

    it('with TRIM', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000
          }
        }),
        ['XADD', 'key', 'NOMKSTREAM', '1000', '*', 'field', 'value']
      );
    });

    it('with TRIM.strategy', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
          field: 'value'
        }, {
          TRIM: {
            strategy: 'MAXLEN',
            threshold: 1000
          }
        }),
        ['XADD', 'key', 'NOMKSTREAM', 'MAXLEN', '1000', '*', 'field', 'value']
      );
    });

    it('with TRIM.strategyModifier', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
          field: 'value'
        }, {
          TRIM: {
            strategyModifier: '=',
            threshold: 1000
          }
        }),
        ['XADD', 'key', 'NOMKSTREAM', '=', '1000', '*', 'field', 'value']
      );
    });

    it('with TRIM.limit', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000,
            limit: 1
          }
        }),
        ['XADD', 'key', 'NOMKSTREAM', '1000', 'LIMIT', '1', '*', 'field', 'value']
      );
    });

    it('with TRIM.policy', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
          field: 'value'
        }, {
          TRIM: {
            threshold: 1000,
            policy: STREAM_DELETION_POLICY.DELREF
          }
        }),
        ['XADD', 'key', 'NOMKSTREAM', '1000', 'DELREF', '*', 'field', 'value']
      );
    });

    it('with all TRIM options', () => {
      assert.deepEqual(
        parseArgs(XADD_NOMKSTREAM, 'key', '*', {
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
        ['XADD', 'key', 'NOMKSTREAM', 'MAXLEN', '~', '1000', 'LIMIT', '100', 'ACKED', '*', 'field', 'value']
      );
    });
  });

  testUtils.testAll(
    'xAddNoMkStream - null when stream does not exist',
    async (client) => {
      assert.equal(
        await client.xAddNoMkStream('{tag}nonexistent-stream', '*', {
          field: 'value'
        }),
        null
      );
    },
    {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN,
    }
  );

  testUtils.testAll(
    'xAddNoMkStream - with all TRIM options',
    async (client) => {
      const streamKey = '{tag}stream';
      
      // Create stream and add some messages
      await client.xAdd(streamKey, '*', { field: 'value1' });
      
      // Use NOMKSTREAM with all TRIM options
      const messageId = await client.xAddNoMkStream(streamKey, '*', 
        { field: 'value2' },
        {
          TRIM: {
            strategyModifier: '~',
            limit: 1,
            strategy: 'MAXLEN',
            threshold: 2,
            policy: STREAM_DELETION_POLICY.DELREF
          }
        }
      );
      
      assert.equal(typeof messageId, 'string');
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );
});
