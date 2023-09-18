import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PERSIST from './PERSIST';

describe('PERSIST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      PERSIST.transformArguments('key'),
      ['PERSIST', 'key']
    );
  });

  testUtils.testAll('persist', async client => {
    assert.equal(
      await client.persist('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
