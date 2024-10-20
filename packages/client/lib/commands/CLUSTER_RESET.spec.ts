import { strict as assert } from 'node:assert';
import CLUSTER_RESET from './CLUSTER_RESET';
import { parseArgs } from './generic-transformers';

describe('CLUSTER RESET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_RESET),
        ['CLUSTER', 'RESET']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_RESET, {
          mode: 'HARD'
        }),
        ['CLUSTER', 'RESET', 'HARD']
      );
    });
  });
});
