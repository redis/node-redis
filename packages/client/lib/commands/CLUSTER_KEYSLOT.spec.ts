import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_KEYSLOT';

describe('CLUSTER KEYSLOT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['CLUSTER', 'KEYSLOT', 'key']
        );
    });
});
