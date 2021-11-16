import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_GETKEYSINSLOT';

describe('CLUSTER GETKEYSINSLOT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0, 10),
            ['CLUSTER', 'GETKEYSINSLOT', '0', '10']
        );
    });
});
