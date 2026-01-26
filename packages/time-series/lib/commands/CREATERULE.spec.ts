import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CREATERULE, { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.CREATERULE', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(CREATERULE, 'source', 'destination', TIME_SERIES_AGGREGATION_TYPE.AVG, 1),
        ['TS.CREATERULE', 'source', 'destination', 'AGGREGATION', 'AVG', '1']
      );
    });

    it('with alignTimestamp', () => {
      assert.deepEqual(
        parseArgs(CREATERULE, 'source', 'destination', TIME_SERIES_AGGREGATION_TYPE.AVG, 1, 1),
        ['TS.CREATERULE', 'source', 'destination', 'AGGREGATION', 'AVG', '1', '1']
      );
    });

    it('with COUNTNAN aggregation type', () => {
      assert.deepEqual(
        parseArgs(CREATERULE, 'source', 'destination', TIME_SERIES_AGGREGATION_TYPE.COUNT_NAN, 1),
        ['TS.CREATERULE', 'source', 'destination', 'AGGREGATION', 'COUNTNAN', '1']
      );
    });

    it('with COUNTALL aggregation type', () => {
      assert.deepEqual(
        parseArgs(CREATERULE, 'source', 'destination', TIME_SERIES_AGGREGATION_TYPE.COUNT_ALL, 1),
        ['TS.CREATERULE', 'source', 'destination', 'AGGREGATION', 'COUNTALL', '1']
      );
    });
  });

  testUtils.testWithClient('client.ts.createRule', async client => {
    const [, , reply] = await Promise.all([
      client.ts.create('source'),
      client.ts.create('destination'),
      client.ts.createRule('source', 'destination', TIME_SERIES_AGGREGATION_TYPE.AVG, 1)
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ts.createRule with COUNTNAN', async client => {
    const [, , reply] = await Promise.all([
      client.ts.create('source-countnan'),
      client.ts.create('destination-countnan'),
      client.ts.createRule('source-countnan', 'destination-countnan', TIME_SERIES_AGGREGATION_TYPE.COUNT_NAN, 1)
    ]);

    assert.equal(reply, 'OK');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithClient('client.ts.createRule with COUNTALL', async client => {
    const [, , reply] = await Promise.all([
      client.ts.create('source-countall'),
      client.ts.create('destination-countall'),
      client.ts.createRule('source-countall', 'destination-countall', TIME_SERIES_AGGREGATION_TYPE.COUNT_ALL, 1)
    ]);

    assert.equal(reply, 'OK');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});
