import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_DELSLOTSRANGE';

describe('CLUSTER DELSLOTSRANGE', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments({
                    start: 0,
                    end: 1
                }),
                ['CLUSTER', 'DELSLOTSRANGE', '0', '1']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments([{
                    start: 0,
                    end: 1
                }, {
                    start: 2,
                    end: 3
                }]),
                ['CLUSTER', 'DELSLOTSRANGE', '0', '1', '2', '3']
            );
        });
    });
});
