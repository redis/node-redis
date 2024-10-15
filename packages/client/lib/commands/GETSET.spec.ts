import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GETSET from './GETSET';

describe('GETSET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      GETSET.transformArguments('key', 'value'),
      ['GETSET', 'key', 'value']
    );
  });

  testUtils.testAll('getSet', async client => {
    assert.equal(
      await client.getSet('key', 'value'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
