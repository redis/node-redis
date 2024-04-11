import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PTTL from './PTTL';

describe('PTTL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      PTTL.transformArguments('key'),
      ['PTTL', 'key']
    );
  });

  testUtils.testAll('pTTL', async client => {
    assert.equal(
      await client.pTTL('key'),
      -2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
