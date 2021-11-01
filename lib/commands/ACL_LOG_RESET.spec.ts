import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments } from './ACL_LOG_RESET';

describe('ACL LOG RESET', () => {
    testUtils.isVersionGreaterThanHook([6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'LOG', 'RESET']
        );
    });
});
