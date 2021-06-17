import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XRANGE';

describe('XRANGE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+'),
                ['XRANGE', 'key', '-', '+']
            );
        });
    
        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    COUNT: 1
                }),
                ['XRANGE', 'key', '-', '+', 'COUNT', '1']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.xRange', async client => {
        assert.deepEqual(
            await client.xRange('key', '+', '-'),
            []
        );
    });
});
