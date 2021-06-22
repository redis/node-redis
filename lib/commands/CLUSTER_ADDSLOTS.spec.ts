import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_ADDSLOTS';

describe('CLUSTER ADDSLOTS', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments(0),
                ['CLUSTER', 'ADDSLOTS', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments([0, 1]),
                ['CLUSTER', 'ADDSLOTS', '0', '1']
            );
        });
    });
});
