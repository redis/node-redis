import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_SETUSER from './ACL_SETUSER';

describe('ACL SETUSER', () => {
  testUtils.isVersionGreaterThanHook([6]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        ACL_SETUSER.transformArguments('username', 'allkeys'),
        ['ACL', 'SETUSER', 'username', 'allkeys']
      );
    });

    it('array', () => {
      assert.deepEqual(
        ACL_SETUSER.transformArguments('username', ['allkeys', 'allchannels']),
        ['ACL', 'SETUSER', 'username', 'allkeys', 'allchannels']
      );
    });
  });
});
