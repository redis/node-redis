import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XLEN from './XLEN';

describe('XLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      XLEN.transformArguments('key'),
      ['XLEN', 'key']
    );
  });

  testUtils.testAll('xLen', async client => {
    assert.equal(
      await client.xLen('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
