import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('DUMP', () => {
  testUtils.testAll('client.dump', async client => {
    assert.equal(
      await client.dump('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
