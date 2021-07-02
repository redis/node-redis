import { strict as assert } from 'assert';
import { transformArguments } from './ACL_LIST';

describe('ACL LIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'LIST']
        );
    });
});
