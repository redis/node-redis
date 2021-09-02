import { strict as assert } from 'assert';
import { describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ACL_SAVE';

describe('ACL SAVE', () => {
    describeHandleMinimumRedisVersion([6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'SAVE']
        );
    });
});
