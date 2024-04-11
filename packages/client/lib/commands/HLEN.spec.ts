import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HLEN from './HLEN';

describe('HLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HLEN.transformArguments('key'),
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
