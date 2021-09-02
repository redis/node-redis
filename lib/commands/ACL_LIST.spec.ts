import { strict as assert } from 'assert';
import { describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ACL_LIST';

describe('ACL LIST', () => {
    describeHandleMinimumRedisVersion([6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'LIST']
        );
    });
});
