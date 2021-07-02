import { strict as assert } from 'assert';
import { transformArguments } from './ACL_LOG_RESET';

describe('ACL LOG RESET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'LOG', 'RESET']
        );
    });
});
