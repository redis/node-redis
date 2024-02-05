import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_WHOAMI from './ACL_WHOAMI';

describe('ACL WHOAMI', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      ACL_WHOAMI.transformArguments(),
      ['ACL', 'WHOAMI']
    );
  });
});
