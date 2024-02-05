import { strict as assert } from 'node:assert';
import CLUSTER_SETSLOT, { CLUSTER_SLOT_STATES } from './CLUSTER_SETSLOT';

describe('CLUSTER SETSLOT', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        CLUSTER_SETSLOT.transformArguments(0, CLUSTER_SLOT_STATES.IMPORTING),
        ['CLUSTER', 'SETSLOT', '0', 'IMPORTING']
      );
    });

    it('with nodeId', () => {
      assert.deepEqual(
        CLUSTER_SETSLOT.transformArguments(0, CLUSTER_SLOT_STATES.IMPORTING, 'nodeId'),
        ['CLUSTER', 'SETSLOT', '0', 'IMPORTING', 'nodeId']
      );
    });
  });
});
