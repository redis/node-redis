import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XDEL from './XDEL';
import { parseArgs } from './generic-transformers';

describe('XDEL', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(XDEL, 'key', '0-0'),
        ['XDEL', 'key', '0-0']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(XDEL, 'key', ['0-0', '1-0']),
        ['XDEL', 'key', '0-0', '1-0']
      );
    });
  });

  testUtils.testAll('xDel', async client => {
    assert.equal(
      await client.xDel('key', '0-0'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
