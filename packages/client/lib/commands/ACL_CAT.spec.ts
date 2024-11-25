import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import ACL_CAT from './ACL_CAT';

describe('ACL CAT', () => {
  testUtils.isVersionGreaterThanHook([6]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ACL_CAT),
        ['ACL', 'CAT']
      );
    });

    it('with categoryName', () => {
      assert.deepEqual(
        parseArgs(ACL_CAT, 'dangerous'),
        ['ACL', 'CAT', 'dangerous']
      );
    });
  });

  testUtils.testWithClient('client.aclCat', async client => {
    const categories = await client.aclCat();
    assert.ok(Array.isArray(categories));
    for (const category of categories) {
      assert.equal(typeof category, 'string');
    }
  }, GLOBAL.SERVERS.OPEN);
});
