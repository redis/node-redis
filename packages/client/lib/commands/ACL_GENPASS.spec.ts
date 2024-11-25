import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_GENPASS from './ACL_GENPASS';
import { parseArgs } from './generic-transformers';

describe('ACL GENPASS', () => {
  testUtils.isVersionGreaterThanHook([6]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ACL_GENPASS),
        ['ACL', 'GENPASS']
      );
    });

    it('with bits', () => {
      assert.deepEqual(
        parseArgs(ACL_GENPASS, 128),
        ['ACL', 'GENPASS', '128']
      );
    });
  });

  testUtils.testWithClient('client.aclGenPass', async client => {
    assert.equal(
      typeof await client.aclGenPass(),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
