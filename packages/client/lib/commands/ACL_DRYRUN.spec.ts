import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_DRYRUN from './ACL_DRYRUN';

describe('ACL DRYRUN', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      ACL_DRYRUN.transformArguments('default', ['GET', 'key']),
      ['ACL', 'DRYRUN', 'default', 'GET', 'key']
    );
  });

  testUtils.testWithClient('client.aclDryRun', async client => {
    assert.equal(
      await client.aclDryRun('default', ['GET', 'key']),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
