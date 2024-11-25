import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_LOAD from './ACL_LOAD';
import { parseArgs } from './generic-transformers';

describe('ACL LOAD', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ACL_LOAD),
      ['ACL', 'LOAD']
    );
  });
});
