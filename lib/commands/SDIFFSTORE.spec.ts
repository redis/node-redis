import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SDIFFSTORE';

describe('SDIFFSTORE', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['SDIFFSTORE', 'destination', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['SDIFFSTORE', 'destination', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.sDiffStore', async client => {
        assert.equal(
            await client.sDiffStore('destination', 'key'),
            0
        );
    });
});
