import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_LIST from './ACL_LIST';
import { parseArgs } from './generic-transformers';

describe('ACL LIST', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ACL_LIST),
      ['ACL', 'LIST']
    );
  });

  testUtils.testWithClient('client.aclList', async client => {
    const users = await client.aclList();
    assert.ok(Array.isArray(users));
    for (const user of users) {
      assert.equal(typeof user, 'string');
    }
  }, GLOBAL.SERVERS.OPEN);
});
