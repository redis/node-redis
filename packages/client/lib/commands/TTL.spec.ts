import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TTL from './TTL';
import { parseArgs } from './generic-transformers';

describe('TTL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(TTL, 'key'),
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
