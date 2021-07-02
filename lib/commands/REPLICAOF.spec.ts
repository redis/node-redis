import { strict as assert } from 'assert';
import { transformArguments } from './REPLICAOF';

describe('REPLICAOF', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('host', 1),
            ['REPLICAOF', 'host', '1']
        );
    });
});
