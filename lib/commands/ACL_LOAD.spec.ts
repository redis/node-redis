import { strict as assert } from 'assert';
import { transformArguments } from './ACL_SAVE';

describe('ACL SAVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'SAVE']
        );
    });
});
