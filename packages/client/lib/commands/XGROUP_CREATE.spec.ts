import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XGROUP_CREATE from './XGROUP_CREATE';

describe('XGROUP CREATE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        XGROUP_CREATE.transformArguments('key', 'group', '$'),
        ['XGROUP', 'CREATE', 'key', 'group', '$']
      );
    });

    it('with MKSTREAM', () => {
      assert.deepEqual(
        XGROUP_CREATE.transformArguments('key', 'group', '$', {
          MKSTREAM: true
        }),
        ['XGROUP', 'CREATE', 'key', 'group', '$', 'MKSTREAM']
      );
    });

    it('with ENTRIESREAD', () => {
      assert.deepEqual(
        XGROUP_CREATE.transformArguments('key', 'group', '$', {
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
