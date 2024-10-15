import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MEMORY_USAGE from './MEMORY_USAGE';
import { parseArgs } from './generic-transformers';

describe('MEMORY USAGE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(MEMORY_USAGE, 'key'),
        ['MEMORY', 'USAGE', 'key']
      );
    });

    it('with SAMPLES', () => {
      assert.deepEqual(
        parseArgs(MEMORY_USAGE, 'key', {
          SAMPLES: 1
        }),
        ['MEMORY', 'USAGE', 'key', 'SAMPLES', '1']
      );
    });
  });

  testUtils.testWithClient('client.memoryUsage', async client => {
    assert.equal(
      await client.memoryUsage('key'),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
