import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_FLUSHSLOTS';

describe('CLUSTER FLUSHSLOTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'FLUSHSLOTS']
        );
    });
});
