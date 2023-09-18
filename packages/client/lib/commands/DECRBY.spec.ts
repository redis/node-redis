import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DECRBY from './DECRBY';

describe('DECRBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      DECRBY.transformArguments('key', 2),
      ['DECRBY', 'key', '2']
    );
  });

  testUtils.testAll('decrBy', async client => {
    assert.equal(
      await client.decrBy('key', 2),
      -2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
