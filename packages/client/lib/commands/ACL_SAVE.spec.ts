import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_SAVE from './ACL_SAVE';
import { parseArgs } from './generic-transformers';

describe('ACL SAVE', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ACL_SAVE),
      ['ACL', 'SAVE']
    );
  });
});
