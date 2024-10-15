import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LSET from './LSET';

describe('LSET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      LSET.transformArguments('key', 0, 'element'),
      ['LSET', 'key', '0', 'element']
    );
  });

  testUtils.testAll('lSet', async client => {
    await client.lPush('key', 'element');
    assert.equal(
      await client.lSet('key', 0, 'element'),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
