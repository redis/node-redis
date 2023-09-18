import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_LOAD from './ACL_LOAD';

describe('ACL LOAD', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      ACL_LOAD.transformArguments(),
      ['ACL', 'LOAD']
    );
  });
});
