import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisFlushModes } from './FLUSHALL';
import { transformArguments } from './FLUSHDB';

describe('FLUSHDB', () => {
    describe('transformArguments', () => {
        it('default', () => {
            assert.deepEqual(
                transformArguments(),
                ['FLUSHDB']
            );
        });

        it('ASYNC', () => {
            assert.deepEqual(
                transformArguments(RedisFlushModes.ASYNC),
                ['FLUSHDB', 'ASYNC']
            );
        });

        it('SYNC', () => {
            assert.deepEqual(
                transformArguments(RedisFlushModes.SYNC),
                ['FLUSHDB', 'SYNC']
            );
        });
    });

    testUtils.testWithClient('client.flushDb', async client => {
        assert.equal(
            await client.flushDb(),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
