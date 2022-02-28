import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_COUNTKEYSINSLOT';

describe('CLUSTER COUNTKEYSINSLOT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(1),
            ['CLUSTER', 'COUNTKEYSINSLOT', '1']
        );
    });
});
