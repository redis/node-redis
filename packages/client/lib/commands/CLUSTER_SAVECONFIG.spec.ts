import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_SAVECONFIG';

describe('CLUSTER SAVECONFIG', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'SAVECONFIG']
        );
    });
});
