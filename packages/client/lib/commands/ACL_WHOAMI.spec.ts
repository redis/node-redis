import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments } from './ACL_WHOAMI';

describe('ACL WHOAMI', () => {
    testUtils.isVersionGreaterThanHook([6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'WHOAMI']
        );
    });
});
