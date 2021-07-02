import { strict as assert } from 'assert';
import { transformArguments } from './ACL_WHOAMI';

describe('ACL WHOAMI', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'WHOAMI']
        );
    });
});
