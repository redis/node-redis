import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HEXISTS from './HEXISTS';

describe('HEXISTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      HEXISTS.transformArguments('key', 'field'),
      ['HEXISTS', 'key', 'field']
    );
  });

  testUtils.testAll('hExists', async client => {
    assert.equal(
      await client.hExists('key', 'field'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
