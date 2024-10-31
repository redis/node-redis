import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XACK from './XACK';
import { parseArgs } from './generic-transformers';

describe('XACK', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(XACK, 'key', 'group', '0-0'),
        ['XACK', 'key', 'group', '0-0']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(XACK, 'key', 'group', ['0-0', '1-0']),
        ['XACK', 'key', 'group', '0-0', '1-0']
      );
    });
  });

  testUtils.testAll('xAck', async client => {
    assert.equal(
      await client.xAck('key', 'group', '0-0'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
