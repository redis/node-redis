import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EXISTS from './EXISTS';

describe('EXISTS', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        EXISTS.transformArguments('key'),
        ['EXISTS', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        EXISTS.transformArguments(['1', '2']),
        ['EXISTS', '1', '2']
      );
    });
  });

  testUtils.testAll('exists', async client => {
    assert.equal(
      await client.exists('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
