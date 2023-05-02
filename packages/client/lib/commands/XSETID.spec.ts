import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import XSETID from './XSETID';

describe('XSETID', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        XSETID.transformArguments('key', '0-0'),
        ['XSETID', 'key', '0-0']
      );
    });

    it('with ENTRIESADDED', () => {
      assert.deepEqual(
        XSETID.transformArguments('key', '0-0', {
          ENTRIESADDED: 1
        }),
        ['XSETID', 'key', '0-0', 'ENTRIESADDED', '1']
      );
    });

    it('with MAXDELETEDID', () => {
      assert.deepEqual(
        XSETID.transformArguments('key', '0-0', {
          MAXDELETEDID: '1-1'
        }),
        ['XSETID', 'key', '0-0', 'MAXDELETEDID', '1-1']
      );
    });
  });

  testUtils.testAll('xSetId', async client => {
    assert.deepEqual(
      await client.xSetId('key', '0-0'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
