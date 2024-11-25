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
  });

  testUtils.testWithClient('client.ts.createRule', async client => {
    const [, , reply] = await Promise.all([
      client.ts.create('source'),
      client.ts.create('destination'),
      client.ts.createRule('source', 'destination', TIME_SERIES_AGGREGATION_TYPE.AVG, 1)
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
