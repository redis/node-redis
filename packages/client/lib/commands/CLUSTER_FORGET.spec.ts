import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_FORGET';

describe('CLUSTER FORGET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('0'),
            ['CLUSTER', 'FORGET', '0']
        );
    });
});
