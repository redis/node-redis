import { strict as assert } from 'node:assert';
import CLIENT_CACHING from './CLIENT_CACHING';

describe('CLIENT CACHING', () => {
  describe('transformArguments', () => {
    it('true', () => {
      assert.deepEqual(
        CLIENT_CACHING.transformArguments(true),
        ['CLIENT', 'CACHING', 'YES']
      );
    });

    it('false', () => {
      assert.deepEqual(
        CLIENT_CACHING.transformArguments(false),
        ['CLIENT', 'CACHING', 'NO']
      );
    });
  });
});
