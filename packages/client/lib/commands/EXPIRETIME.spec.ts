import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EXPIRETIME from './EXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('EXPIRETIME', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EXPIRETIME, 'key'),
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
