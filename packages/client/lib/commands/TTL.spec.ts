import { strict as assert } from 'assert';
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
    console.log(await client.get('key'), await client.ttl('key'));
    assert.equal(
      await client.ttl('key'),
      -2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
