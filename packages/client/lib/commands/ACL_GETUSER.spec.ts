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

  testUtils.testWithClient('client.aclGetUser with structural assertion', async client => {
    const reply = await client.aclGetUser('default');

    // Structurally assert the complete response shape to catch RESP2→RESP3 differences
    // The response must be an object (not an array) with specific fields
    assert.equal(typeof reply, 'object');
    assert.ok(reply !== null);
    assert.ok(!Array.isArray(reply)); // Must be object, not array

    // Deep structural assertion: verify all expected keys exist and have correct types
    assert.ok('flags' in reply);
    assert.ok('passwords' in reply);
    assert.ok('commands' in reply);
    assert.ok('keys' in reply);
    assert.ok('channels' in reply);

    assert.ok(Array.isArray(reply.flags));
    assert.ok(Array.isArray(reply.passwords));
    assert.equal(typeof reply.commands, 'string');

    // Verify the structure matches expected object shape, not a flat array
    const expectedKeys = testUtils.isVersionGreaterThan([7])
      ? ['channels', 'commands', 'flags', 'keys', 'passwords', 'selectors']
      : testUtils.isVersionGreaterThan([6, 2])
        ? ['channels', 'commands', 'flags', 'keys', 'passwords']
        : ['commands', 'flags', 'keys', 'passwords'];

    assert.deepEqual(Object.keys(reply).sort(), expectedKeys.sort());
  }, GLOBAL.SERVERS.OPEN);
});
