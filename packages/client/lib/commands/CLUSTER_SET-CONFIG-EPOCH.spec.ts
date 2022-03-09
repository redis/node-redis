import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_SET-CONFIG-EPOCH';

describe('CLUSTER SET-CONFIG-EPOCH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0),
            ['CLUSTER', 'SET-CONFIG-EPOCH', '0']
        );
    });
});
