import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_ADDSLOTSRANGE';

describe('CLUSTER ADDSLOTSRANGE', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments([0, 1]),
                ['CLUSTER', 'ADDSLOTSRANGE', '0', '1']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments([0, 1], [2, 3]),
                ['CLUSTER', 'ADDSLOTSRANGE', '0', '1', '2', '3']
            );
        });
    });
});
