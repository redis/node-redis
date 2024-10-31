import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XSETID from './XSETID';
import { parseArgs } from './generic-transformers';

describe('XSETID', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XSETID, 'key', '0-0'),
        ['XSETID', 'key', '0-0']
      );
    });

    it('with ENTRIESADDED', () => {
      assert.deepEqual(
        parseArgs(XSETID, 'key', '0-0', {
          ENTRIESADDED: 1
        }),
        ['XSETID', 'key', '0-0', 'ENTRIESADDED', '1']
      );
    });

    it('with MAXDELETEDID', () => {
      assert.deepEqual(
        parseArgs(XSETID, 'key', '0-0', {
          MAXDELETEDID: '1-1'
        }),
        ['XSETID', 'key', '0-0', 'MAXDELETEDID', '1-1']
      );
    });
  });

  testUtils.testAll('xSetId', async client => {
    const id = await client.xAdd('key', '*', {
      field: 'value'
    });

    assert.equal(
      await client.xSetId('key', id),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
