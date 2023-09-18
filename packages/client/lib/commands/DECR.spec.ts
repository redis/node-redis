import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DECR from './DECR';

describe('DECR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      DECR.transformArguments('key'),
      ['DECR', 'key']
    );
  });

  testUtils.testAll('decr', async client => {
    assert.equal(
      await client.decr('key'),
      -1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
