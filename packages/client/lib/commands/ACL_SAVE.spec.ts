import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_SAVE from './ACL_SAVE';

describe('ACL SAVE', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      ACL_SAVE.transformArguments(),
      ['ACL', 'SAVE']
    );
  });
});
