import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_WHOAMI from './ACL_WHOAMI';
import { parseArgs } from './generic-transformers';

describe('ACL WHOAMI', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ACL_WHOAMI),
      ['ACL', 'WHOAMI']
    );
  });

  testUtils.testWithClient('client.aclWhoAmI', async client => {
    assert.equal(
      await client.aclWhoAmI(),
      'default'
    );
  }, GLOBAL.SERVERS.OPEN);
});
