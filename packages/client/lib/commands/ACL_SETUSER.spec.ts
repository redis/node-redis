import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_SETUSER from './ACL_SETUSER';
import { parseArgs } from './generic-transformers';

describe('ACL SETUSER', () => {
  testUtils.isVersionGreaterThanHook([6]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(ACL_SETUSER, 'username', 'allkeys'),
        ['ACL', 'SETUSER', 'username', 'allkeys']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(ACL_SETUSER, 'username', ['allkeys', 'allchannels']),
        ['ACL', 'SETUSER', 'username', 'allkeys', 'allchannels']
      );
    });
  });

  testUtils.testWithClient('client.aclSetUser', async client => {
    const username = `acl-setuser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let deleted = false;

    try {
      assert.equal(
        await client.aclSetUser(username, ['reset', 'on', '>password', '+get', '~*']),
        'OK'
      );

      const created = await client.aclGetUser(username);
      assert.equal(typeof created.commands, 'string');
      assert.equal(created.commands.includes('+get'), true);

      assert.equal(
        await client.aclSetUser(username, ['reset', 'on', '>new-password', '+set', '~*']),
        'OK'
      );

      const updated = await client.aclGetUser(username);
      assert.equal(typeof updated.commands, 'string');
      assert.equal(updated.commands.includes('+set'), true);
      assert.equal(updated.commands.includes('+get'), false);

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
