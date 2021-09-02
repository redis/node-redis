import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SUNIONSTORE';

describe('SUNIONSTORE', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['SUNIONSTORE', 'destination', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['SUNIONSTORE', 'destination', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.sUnionStore', async client => {
        assert.equal(
            await client.sUnionStore('destination', 'key'),
            0
        );
    });
});
