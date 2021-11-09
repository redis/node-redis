import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments } from './ACL_GENPASS';

describe('ACL GENPASS', () => {
    testUtils.isVersionGreaterThanHook([6]);

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
