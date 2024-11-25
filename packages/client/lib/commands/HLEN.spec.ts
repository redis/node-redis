import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HLEN from './HLEN';
import { parseArgs } from './generic-transformers';

describe('HLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HLEN, 'key'),
      ['HLEN', 'key']
    );
  });

  testUtils.testAll('hLen', async client => {
    assert.equal(
      await client.hLen('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
