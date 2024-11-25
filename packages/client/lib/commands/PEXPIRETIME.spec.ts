import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PEXPIRETIME from './PEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('PEXPIRETIME', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(PEXPIRETIME, 'key'),
      ['PEXPIRETIME', 'key']
    );
  });

  testUtils.testAll('pExpireTime', async client => {
    assert.equal(
      await client.pExpireTime('key'),
      -2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
