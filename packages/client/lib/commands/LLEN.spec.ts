import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LLEN from './LLEN';

describe('LLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      LLEN.transformArguments('key'),
      ['LLEN', 'key']
    );
  });

  testUtils.testAll('lLen', async client => {
    assert.equal(
      await client.lLen('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
