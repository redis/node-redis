import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SINTER from './SINTER';
import { parseArgs } from './generic-transformers';

describe('SINTER', () => {
  describe('processCommand', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SINTER, 'key'),
        ['SINTER', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SINTER, ['1', '2']),
        ['SINTER', '1', '2']
      );
    });
  });

  testUtils.testAll('sInter', async client => {
    assert.deepEqual(
      await client.sInter('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
