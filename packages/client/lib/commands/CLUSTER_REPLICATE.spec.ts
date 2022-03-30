import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_REPLICATE';

describe('CLUSTER REPLICATE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('0'),
            ['CLUSTER', 'REPLICATE', '0']
        );
    });
});
