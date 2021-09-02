import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SPOP';

describe('SPOP', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['SPOP', 'key']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments('key', 2),
                ['SPOP', 'key', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.sPop', async client => {
        assert.equal(
            await client.sPop('key'),
            null
        );
    });
});
