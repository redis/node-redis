import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_GETUSER from './ACL_GETUSER';
import { parseArgs } from './generic-transformers';

describe('ACL GETUSER', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ACL_GETUSER, 'username'),
      ['ACL', 'GETUSER', 'username']
    );
  });

  testUtils.testWithClient('client.aclGetUser', async client => {
    const reply = await client.aclGetUser('default');

    assert.ok(Array.isArray(reply.passwords));
    assert.equal(typeof reply.commands, 'string');
    assert.ok(Array.isArray(reply.flags));

    if (testUtils.isVersionGreaterThan([7])) {
      assert.equal(typeof reply.keys, 'string');
      assert.equal(typeof reply.channels, 'string');
      assert.ok(Array.isArray(reply.selectors));
    } else {
      assert.ok(Array.isArray(reply.keys));

      if (testUtils.isVersionGreaterThan([6, 2])) {
        assert.ok(Array.isArray(reply.channels));
      }
    }
  }, GLOBAL.SERVERS.OPEN);
});
