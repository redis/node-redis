import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TOUCH from './TOUCH';
import { parseArgs } from './generic-transformers';

describe('TOUCH', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(TOUCH, 'key'),
        ['TOUCH', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(TOUCH, ['1', '2']),
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
