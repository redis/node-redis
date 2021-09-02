import { strict as assert } from 'assert';
import { describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ACL_GENPASS';

describe('ACL GENPASS', () => {
    describeHandleMinimumRedisVersion([6]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['ACL', 'GENPASS']
            );
        });

        it('with bits', () => {
            assert.deepEqual(
                transformArguments(128),
                ['ACL', 'GENPASS', '128']
            );
        });
    });
});
