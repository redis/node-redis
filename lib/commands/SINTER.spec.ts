import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './SINTER';

describe('SINTER', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['SINTER', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['SINTER', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.sInter', async client => {
        assert.deepEqual(
            await client.sInter('key'),
            []
        );
    });
});
