import { strict as assert } from 'node:assert';
import CLUSTER_RESET from './CLUSTER_RESET';

describe('CLUSTER RESET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        CLUSTER_RESET.transformArguments(),
        ['CLUSTER', 'RESET']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        CLUSTER_RESET.transformArguments({
          mode: 'HARD'
        }),
        ['CLUSTER', 'RESET', 'HARD']
      );
    });
  });
});
