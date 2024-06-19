import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SDIFF from './SDIFF';
import { parseArgs } from './generic-transformers';

describe('SDIFF', () => {
  describe('processCommand', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SDIFF, 'key'),
        ['SDIFF', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SDIFF, ['1', '2']),
        ['SDIFF', '1', '2']
      );
    });
  });

  testUtils.testAll('sDiff', async client => {
    assert.deepEqual(
      await client.sDiff('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
