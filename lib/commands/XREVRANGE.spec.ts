import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './XREVRANGE';

describe('XREVRANGE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+'),
                ['XREVRANGE', 'key', '-', '+']
            );
        });
    
        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', '-', '+', {
                    COUNT: 1
                }),
                ['XREVRANGE', 'key', '-', '+', 'COUNT', '1']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.xRevRange', async client => {
        assert.deepEqual(
            await client.xRevRange('key', '+', '-'),
            []
        );
    });
});
