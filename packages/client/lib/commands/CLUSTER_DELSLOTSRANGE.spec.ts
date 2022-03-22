import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_DELSLOTSRANGE';

describe('CLUSTER DELSLOTSRANGE', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments([0, 1]),
                ['CLUSTER', 'DELSLOTSRANGE', '0', '1']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments([0, 1], [2, 3]),
                ['CLUSTER', 'DELSLOTSRANGE', '0', '1', '2', '3']
            );
        });
    });
});
