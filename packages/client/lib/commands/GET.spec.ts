import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GET from './GET';

describe('GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      GET.transformArguments('key'),
      ['GET', 'key']
    );
  });

  testUtils.testAll('get', async client => {
    assert.equal(
      await client.get('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
