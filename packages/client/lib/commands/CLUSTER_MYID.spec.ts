import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_MYID';

describe('CLUSTER MYID', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'MYID']
        );
    });
});
