import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TOUCH from './TOUCH';

describe('TOUCH', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        TOUCH.transformArguments('key'),
        ['TOUCH', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        TOUCH.transformArguments(['1', '2']),
        ['TOUCH', '1', '2']
      );
    });
  });

  testUtils.testAll('touch', async client => {
    assert.equal(
      await client.touch('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
