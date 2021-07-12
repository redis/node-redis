import { strict as assert } from 'assert';
import { describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ACL_LOAD';

describe('ACL LOAD', () => {
    describeHandleMinimumRedisVersion([6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ACL', 'LOAD']
        );
    });
});
