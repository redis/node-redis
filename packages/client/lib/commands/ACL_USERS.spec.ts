import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
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
});
