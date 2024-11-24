import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EXISTS from './EXISTS';
import { parseArgs } from './generic-transformers';

describe('EXISTS', () => {
  describe('parseCommand', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(EXISTS, 'key'),
        ['EXISTS', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(EXISTS, ['1', '2']),
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
