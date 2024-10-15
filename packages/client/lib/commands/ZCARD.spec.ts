import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZCARD from './ZCARD';
import { parseArgs } from './generic-transformers';

describe('ZCARD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZCARD, 'key'),
      ['ZCARD', 'key']
    );
  });

  testUtils.testAll('zCard', async client => {
    assert.equal(
      await client.zCard('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
