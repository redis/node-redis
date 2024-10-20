import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DELETERULE from './DELETERULE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.DELETERULE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DELETERULE, 'source', 'destination'),
      ['TS.DELETERULE', 'source', 'destination']
    );
  });

  testUtils.testWithClient('client.ts.deleteRule', async client => {
    const [, , , reply] = await Promise.all([
      client.ts.create('source'),
      client.ts.create('destination'),
      client.ts.createRule('source', 'destination', TIME_SERIES_AGGREGATION_TYPE.AVG, 1),
      client.ts.deleteRule('source', 'destination')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
