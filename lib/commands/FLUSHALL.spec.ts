import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisFlushModes, transformArguments } from './FLUSHALL';

describe('FLUSHALL', () => {
    describe('transformArguments', () => {
        it('default', () => {
            assert.deepEqual(
                transformArguments(),
                ['FLUSHALL']
            );
        });

        it('ASYNC', () => {
            assert.deepEqual(
                transformArguments(RedisFlushModes.ASYNC),
                ['FLUSHALL', 'ASYNC']
            );
        });

        it('SYNC', () => {
            assert.deepEqual(
                transformArguments(RedisFlushModes.SYNC),
                ['FLUSHALL', 'SYNC']
            );
        });
    });

    testUtils.testWithClient('client.flushAll', async client => {
        assert.equal(
            await client.flushAll(),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
