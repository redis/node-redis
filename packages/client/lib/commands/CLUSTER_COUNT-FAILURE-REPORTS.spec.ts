import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_COUNT-FAILURE-REPORTS';

describe('CLUSTER COUNT-FAILURE-REPORTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('1'),
            ['CLUSTER', 'COUNT-FAILURE-REPORTS', '1']
        );
    });
});
