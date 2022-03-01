import { strict as assert } from 'assert';
import { ClusterSlotStates, transformArguments } from './CLUSTER_SETSLOT';

describe('CLUSTER SETSLOT', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(0, ClusterSlotStates.IMPORTING),
                ['CLUSTER', 'SETSLOT', '0', 'IMPORTING']
            );
        });

        it('with nodeId', () => {
            assert.deepEqual(
                transformArguments(0, ClusterSlotStates.IMPORTING, 'nodeId'),
                ['CLUSTER', 'SETSLOT', '0', 'IMPORTING', 'nodeId']
            );
        });
    });
});
