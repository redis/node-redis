import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_SLAVES';

describe('CLUSTER SLAVES', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('0'),
            ['CLUSTER', 'SLAVES', '0']
        );
    });
});
