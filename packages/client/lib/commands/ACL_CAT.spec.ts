import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments } from './ACL_CAT';

describe('ACL CAT', () => {
    testUtils.isVersionGreaterThanHook([6]);

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
