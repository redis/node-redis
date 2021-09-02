import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './UNLINK';

describe('UNLINK', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['UNLINK', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['UNLINK', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.unlink', async client => {
        assert.equal(
            await client.unlink('key'),
            0
        );
    });
});
