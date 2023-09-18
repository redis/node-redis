import { strict as assert } from 'node:assert';
import WATCH from './WATCH';

describe('WATCH', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        WATCH.transformArguments('key'),
        ['WATCH', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        WATCH.transformArguments(['1', '2']),
        ['WATCH', '1', '2']
      );
    });
  });
});
