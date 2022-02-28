import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_DELSLOTS';

describe('CLUSTER DELSLOTS', () => {
    it('simple', () => {
        assert.deepEqual(
            transformArguments('1'),
            ['CLUSTER', 'DELSLOTS', '1']
        );
    });
});
