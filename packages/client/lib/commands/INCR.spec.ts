import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INCR from './INCR';

describe('INCR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      INCR.transformArguments('key'),
      ['INCR', 'key']
    );
  });

  testUtils.testAll('incr', async client => {
    assert.equal(
      await client.incr('key'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
