import { strict as assert } from 'assert';
import { transformArguments } from './MODULE_UNLOAD';

describe('MODULE UNLOAD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('name'),
            ['MODULE', 'UNLOAD', 'name']
        );
    });
});
