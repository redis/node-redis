import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_DELUSER from './ACL_DELUSER';
import { parseArgs } from './generic-transformers';

describe('ACL DELUSER', () => {
  testUtils.isVersionGreaterThanHook([6]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(ACL_DELUSER, 'username'),
        ['ACL', 'DELUSER', 'username']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(ACL_DELUSER, ['1', '2']),
        ['ACL', 'DELUSER', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.aclDelUser', async client => {
    assert.equal(
      typeof await client.aclDelUser('user'),
      'number'
    );
  }, GLOBAL.SERVERS.OPEN);
});
