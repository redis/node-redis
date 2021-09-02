import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HSETNX';

describe('HSETNX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field', 'value'),
            ['HSETNX', 'key', 'field', 'value']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hSetNX', async client => {
        assert.equal(
            await client.hSetNX('key', 'field', 'value'),
            true
        );
    });
});
