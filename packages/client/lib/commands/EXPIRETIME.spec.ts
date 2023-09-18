import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EXPIRETIME from './EXPIRETIME';

describe('EXPIRETIME', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      EXPIRETIME.transformArguments('key'),
      ['EXPIRETIME', 'key']
    );
  });

  testUtils.testAll('expireTime', async client => {
    assert.equal(
      await client.expireTime('key'),
      -2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
