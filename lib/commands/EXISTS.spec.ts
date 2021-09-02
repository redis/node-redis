import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './EXISTS';

describe('EXISTS', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['EXISTS', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['EXISTS', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.exists', async client => {
        assert.equal(
            await client.exists('key'),
            false
        );
    });
});
