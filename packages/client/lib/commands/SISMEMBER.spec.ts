import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SISMEMBER from './SISMEMBER';

describe('SISMEMBER', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SISMEMBER.transformArguments('key', 'member'),
      ['SISMEMBER', 'key', 'member']
    );
  });

  testUtils.testAll('sIsMember', async client => {
    assert.equal(
      await client.sIsMember('key', 'member'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
