import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZRANDMEMBER';

describe('ZRANDMEMBER', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZRANDMEMBER', 'key']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['ZRANDMEMBER', 'key', '1']
            );
        });

        it('with count, WITHSCORES', () => {
            assert.deepEqual(
                transformArguments('key', 1, true),
                ['ZRANDMEMBER', 'key', '1', 'WITHSCORES']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zRandMember', async client => {
        assert.equal(
            await client.zRandMember('key'),
            null
        );
    });
});
