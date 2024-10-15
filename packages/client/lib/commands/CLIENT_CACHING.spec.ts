import { strict as assert } from 'node:assert';
import CLIENT_CACHING from './CLIENT_CACHING';
import { parseArgs } from './generic-transformers';

describe('CLIENT CACHING', () => {
  describe('transformArguments', () => {
    it('true', () => {
      assert.deepEqual(
        parseArgs(CLIENT_CACHING, true),
        ['CLIENT', 'CACHING', 'YES']
      );
    });

    it('false', () => {
      assert.deepEqual(
        parseArgs(CLIENT_CACHING, false),
        ['CLIENT', 'CACHING', 'NO']
      );
    });
  });
});
