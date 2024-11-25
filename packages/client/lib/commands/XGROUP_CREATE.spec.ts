import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XGROUP_CREATE from './XGROUP_CREATE';
import { parseArgs } from './generic-transformers';

describe('XGROUP CREATE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XGROUP_CREATE, 'key', 'group', '$'),
        ['XGROUP', 'CREATE', 'key', 'group', '$']
      );
    });

    it('with MKSTREAM', () => {
      assert.deepEqual(
        parseArgs(XGROUP_CREATE, 'key', 'group', '$', {
          MKSTREAM: true
        }),
        ['XGROUP', 'CREATE', 'key', 'group', '$', 'MKSTREAM']
      );
    });

    it('with ENTRIESREAD', () => {
      assert.deepEqual(
        parseArgs(XGROUP_CREATE, 'key', 'group', '$', {
          ENTRIESREAD: 1
        }),
        ['XGROUP', 'CREATE', 'key', 'group', '$', 'ENTRIESREAD', '1']
      );
    });
  });

  testUtils.testAll('xGroupCreate', async client => {
    assert.equal(
      await client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
