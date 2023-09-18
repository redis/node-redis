import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LINDEX from './LINDEX';

describe('LINDEX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      LINDEX.transformArguments('key', 0),
      ['LINDEX', 'key', '0']
    );
  });

  testUtils.testAll('lIndex', async client => {
    assert.equal(
      await client.lIndex('key', 0),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});