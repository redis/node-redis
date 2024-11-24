import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUNION from './SUNION';
import { parseArgs } from './generic-transformers';

describe('SUNION', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SUNION, 'key'),
        ['SUNION', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SUNION, ['1', '2']),
        ['SUNION', '1', '2']
      );
    });
  });

  testUtils.testAll('sUnion', async client => {
    assert.deepEqual(
      await client.sUnion('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
