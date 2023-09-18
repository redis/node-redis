import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import PFCOUNT from './PFCOUNT';

describe('PFCOUNT', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        PFCOUNT.transformArguments('key'),
        ['PFCOUNT', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        PFCOUNT.transformArguments(['1', '2']),
        ['PFCOUNT', '1', '2']
      );
    });
  });

  testUtils.testAll('pfCount', async client => {
    assert.equal(
      await client.pfCount('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
