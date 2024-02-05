import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEBUG_MEMORY from './DEBUG_MEMORY';

describe('JSON.DEBUG MEMORY', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        DEBUG_MEMORY.transformArguments('key'),
        ['JSON.DEBUG', 'MEMORY', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        DEBUG_MEMORY.transformArguments('key', {
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
