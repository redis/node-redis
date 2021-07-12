import { strict as assert } from 'assert';
import { describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ACL_CAT';

describe('ACL CAT', () => {
    describeHandleMinimumRedisVersion([6]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['ACL', 'CAT']
            );
        });

        it('with categoryName', () => {
            assert.deepEqual(
                transformArguments('dangerous'),
                ['ACL', 'CAT', 'dangerous']
            );
        });
    });
});
