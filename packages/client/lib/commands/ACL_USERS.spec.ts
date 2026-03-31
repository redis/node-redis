import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_USERS from './ACL_USERS';
import { parseArgs } from './generic-transformers';

describe('ACL USERS', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ACL_USERS),
      ['ACL', 'USERS']
    );
  });

  testUtils.testWithClient('client.aclUsers', async client => {
    const username = `acl-users-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let deleted = false;

    try {
      assert.equal(
        await client.aclSetUser(username, ['reset', 'on', '>password', '+get', '~*']),
        'OK'
      );

      const users = await client.aclUsers();
      assert.equal(users.includes('default'), true);
      assert.equal(users.includes(username), true);

      assert.equal(
        await client.aclDelUser(username),
        1
      );
      deleted = true;
    } finally {
      if (!deleted) {
        await client.aclDelUser(username);
      }
    }
  }, GLOBAL.SERVERS.OPEN);
});
