import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEBUG_MEMORY from './DEBUG_MEMORY';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.DEBUG MEMORY', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(DEBUG_MEMORY, 'key'),
        ['JSON.DEBUG', 'MEMORY', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(DEBUG_MEMORY, 'key', {
          path: '$'
        }),
        ['JSON.DEBUG', 'MEMORY', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.debugMemory', async client => {
    assert.equal(
      await client.json.debugMemory('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
