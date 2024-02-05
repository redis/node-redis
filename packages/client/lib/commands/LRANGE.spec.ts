import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LRANGE from './LRANGE';

describe('LRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      LRANGE.transformArguments('key', 0, -1),
      ['LRANGE', 'key', '0', '-1']
    );
  });

  testUtils.testAll('lRange', async client => {
    assert.deepEqual(
      await client.lRange('key', 0, -1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
