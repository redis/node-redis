import { strict as assert } from 'assert';
import { transformArguments } from './ACL_LOAD';

describe('ACL LOAD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'LOAD']
        );
    });
});
