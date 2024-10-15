import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LPOP from './LPOP';

describe('LPOP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      LPOP.transformArguments('key'),
      ['LPOP', 'key']
    );
  });

  testUtils.testAll('lPop', async client => {
    assert.equal(
      await client.lPop('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
