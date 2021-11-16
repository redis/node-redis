import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ACL_DELUSER';

describe('ACL DELUSER', () => {
    testUtils.isVersionGreaterThanHook([6]);

    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('username'),
                ['ACL', 'DELUSER', 'username']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ACL', 'DELUSER', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.aclDelUser', async client => {
        assert.equal(
            await client.aclDelUser('dosenotexists'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
