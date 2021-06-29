import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './DEL';

describe('DEL', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['DEL', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['key1', 'key2']),
                ['DEL', 'key1', 'key2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.del', async client => {
        assert.equal(
            await client.del('key'),
            0
        );
    });
});
