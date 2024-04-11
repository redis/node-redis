import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import UNLINK from './UNLINK';

describe('UNLINK', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        UNLINK.transformArguments('key'),
        ['UNLINK', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        UNLINK.transformArguments(['1', '2']),
        ['UNLINK', '1', '2']
      );
    });
  });

  testUtils.testAll('unlink', async client => {
    assert.equal(
      await client.unlink('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
