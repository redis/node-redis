import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_LIST from './ACL_LIST';

describe('ACL LIST', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      ACL_LIST.transformArguments(),
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
