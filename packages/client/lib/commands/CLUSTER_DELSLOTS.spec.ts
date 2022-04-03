import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_DELSLOTS';

describe('CLUSTER DELSLOTS', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments(0),
                ['CLUSTER', 'DELSLOTS', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments([0, 1]),
                ['CLUSTER', 'DELSLOTS', '0', '1']
            );
        });
    });
});
