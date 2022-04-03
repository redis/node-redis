import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_RESET';

describe('CLUSTER RESET', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['CLUSTER', 'RESET']
            );
        });

        it('with mode', () => {
            assert.deepEqual(
                transformArguments('HARD'),
                ['CLUSTER', 'RESET', 'HARD']
            );
        });
    });
});
