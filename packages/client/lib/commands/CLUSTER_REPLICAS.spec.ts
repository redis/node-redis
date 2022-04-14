import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_REPLICAS';

describe('CLUSTER REPLICAS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('0'),
            ['CLUSTER', 'REPLICAS', '0']
        );
    });
});
