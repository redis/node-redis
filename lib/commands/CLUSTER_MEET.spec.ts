import { strict as assert } from 'assert';
import { transformArguments } from './CLUSTER_MEET';

describe('CLUSTER MEET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('127.0.0.1', 6379),
            ['CLUSTER', 'MEET', '127.0.0.1', '6379']
        );
    });
});
