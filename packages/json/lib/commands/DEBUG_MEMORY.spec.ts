import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import DEBUG_MEMORY from './DEBUG_MEMORY';

describe('DEBUG MEMORY', () => {
  describe('transformArguments', () => {
    it('without path', () => {
      assert.deepEqual(
        DEBUG_MEMORY.transformArguments('key'),
        ['JSON.DEBUG', 'MEMORY', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        DEBUG_MEMORY.transformArguments('key', '$'),
        ['JSON.DEBUG', 'MEMORY', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.arrTrim', async client => {
    assert.deepEqual(
      await client.json.debugMemory('key', '$'),
      []
    );
  }, GLOBAL.SERVERS.OPEN);
});
