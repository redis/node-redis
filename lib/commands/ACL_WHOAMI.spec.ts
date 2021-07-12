import { strict as assert } from 'assert';
import { describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ACL_WHOAMI';

describe('ACL WHOAMI', () => {
    describeHandleMinimumRedisVersion([6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'WHOAMI']
        );
    });
});
