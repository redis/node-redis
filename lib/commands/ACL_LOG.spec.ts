import { strict as assert } from 'assert';
import { describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ACL_LOG';

describe('ACL LOG', () => {
    describeHandleMinimumRedisVersion([6]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['ACL', 'LOG']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments(10),
                ['ACL', 'LOG', '10']
            );
        });
    });
});
