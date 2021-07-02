import { strict as assert } from 'assert';
import { transformArguments } from './ACL_USERS';

describe('ACL USERS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'USERS']
        );
    });
});
