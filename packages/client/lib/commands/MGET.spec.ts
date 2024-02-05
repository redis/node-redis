import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET from './MGET';

describe('MGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MGET.transformArguments(['1', '2']),
      ['MGET', '1', '2']
    );
  });

  testUtils.testAll('mGet', async client => {
    assert.deepEqual(
      await client.mGet(['key']),
      [null]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
