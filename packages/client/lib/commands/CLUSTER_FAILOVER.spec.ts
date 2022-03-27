import { strict as assert } from 'assert';
import { FailoverModes, transformArguments } from './CLUSTER_FAILOVER';

describe('CLUSTER FAILOVER', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['CLUSTER', 'FAILOVER']
            );
        });
        
        it('with mode', () => {
            assert.deepEqual(
                transformArguments(FailoverModes.FORCE),
                ['CLUSTER', 'FAILOVER', 'FORCE']
            );
        });
    });
});
