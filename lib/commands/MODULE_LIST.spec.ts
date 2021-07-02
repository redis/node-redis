import { strict as assert } from 'assert';
import { transformArguments } from './MODULE_LIST';

describe('MODULE LIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['MODULE', 'LIST']
        );
    });
});
