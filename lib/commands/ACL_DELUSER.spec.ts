import { strict as assert } from 'assert';
import { itWithClient, TestRedisServers } from '../test-utils';
import { transformArguments } from './ACL_DELUSER';

describe('ACL DELUSER', () => {
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

    itWithClient(TestRedisServers.OPEN, 'client.aclDelUser', async client => {
        assert.equal(
            await client.aclDelUser('dosenotexists'),
            0
        );
    });
});
