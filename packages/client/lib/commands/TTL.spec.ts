import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TTL from './TTL';

describe('TTL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      TTL.transformArguments('key'),
      ['TTL', 'key']
    );
  });

  testUtils.testAll('ttl', async client => {
    assert.equal(
      await client.ttl('key'),
      -2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
