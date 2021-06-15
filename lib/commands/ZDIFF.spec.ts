import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './ZDIFF';

describe('ZDIFF', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['ZDIFF', '1', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZDIFF', '2', '1', '2']
            );
        });

        it('WITHSCORES', () => {
            assert.deepEqual(
                transformArguments('key', {
                    WITHSCORES: true
                }),
                ['ZDIFF', '1', 'key', 'WITHSCORES']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zDiff', async client => {
        assert.deepEqual(
            await client.zDiff('key'),
            []
        );
    });
});
