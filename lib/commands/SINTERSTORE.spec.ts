import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SINTERSTORE';

describe('SINTERSTORE', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['SINTERSTORE', 'destination', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['SINTERSTORE', 'destination', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.sInterStore', async client => {
        assert.equal(
            await client.sInterStore('destination', 'key'),
            0
        );
    });
});
