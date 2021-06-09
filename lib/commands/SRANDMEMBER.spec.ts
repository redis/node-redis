import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SRANDMEMBER';

describe('SRANDMEMBER', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['SRANDMEMBER', 'key']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments('key', 2),
                ['SRANDMEMBER', 'key', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.sRandMember', async client => {
        assert.equal(
            await client.sRandMember('key'),
            null
        );
    });
});
