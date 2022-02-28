import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_BUMPEPOCH';

describe('CLUSTER BUMPEPOCH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'BUMPEPOCH']
        );
    });
});
