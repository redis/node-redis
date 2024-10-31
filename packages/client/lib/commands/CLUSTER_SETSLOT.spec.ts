import { strict as assert } from 'node:assert';
import CLUSTER_SETSLOT, { CLUSTER_SLOT_STATES } from './CLUSTER_SETSLOT';
import { parseArgs } from './generic-transformers';

describe('CLUSTER SETSLOT', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_SETSLOT, 0, CLUSTER_SLOT_STATES.IMPORTING),
        ['CLUSTER', 'SETSLOT', '0', 'IMPORTING']
      );
    });

    it('with nodeId', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_SETSLOT, 0, CLUSTER_SLOT_STATES.IMPORTING, 'nodeId'),
        ['CLUSTER', 'SETSLOT', '0', 'IMPORTING', 'nodeId']
      );
    });
  });
});
