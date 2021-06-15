import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZMSCORE';

describe('ZMSCORE', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['ZMSCORE', 'key', 'member']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['ZMSCORE', 'key', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zmScore', async client => {
        assert.deepEqual(
            await client.zmScore('key', 'member'),
            [null]
        );
    });
});
