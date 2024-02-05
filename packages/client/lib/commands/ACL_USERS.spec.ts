import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_USERS from './ACL_USERS';

describe('ACL USERS', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      ACL_USERS.transformArguments(),
      ['ACL', 'USERS']
    );
  });
});
