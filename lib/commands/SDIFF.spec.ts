import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SDIFF';

describe('SDIFF', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['SDIFF', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['SDIFF', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.sDiff', async client => {
        assert.deepEqual(
            await client.sDiff('key'),
            []
        );
    });
});
