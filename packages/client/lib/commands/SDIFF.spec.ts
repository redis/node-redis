import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SDIFF from './SDIFF';

describe('SDIFF', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        SDIFF.transformArguments('key'),
        ['SDIFF', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        SDIFF.transformArguments(['1', '2']),
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
