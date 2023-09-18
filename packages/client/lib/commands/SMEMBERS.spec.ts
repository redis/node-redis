import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SMEMBERS from './SMEMBERS';

describe('SMEMBERS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SMEMBERS.transformArguments('key'),
      ['SMEMBERS', 'key']
    );
  });

  testUtils.testAll('sMembers', async client => {
    assert.deepEqual(
      await client.sMembers('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
