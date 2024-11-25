import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import ACL_SETUSER from './ACL_SETUSER';
import { parseArgs } from './generic-transformers';

describe('ACL SETUSER', () => {
  testUtils.isVersionGreaterThanHook([6]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(ACL_SETUSER, 'username', 'allkeys'),
        ['ACL', 'SETUSER', 'username', 'allkeys']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(ACL_SETUSER, 'username', ['allkeys', 'allchannels']),
        ['ACL', 'SETUSER', 'username', 'allkeys', 'allchannels']
      );
    });
  });
});
