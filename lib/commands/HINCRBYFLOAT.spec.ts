import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HINCRBYFLOAT';

describe('HINCRBYFLOAT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field', 1.5),
            ['HINCRBYFLOAT', 'key', 'field', '1.5']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hIncrByFloat', async client => {
        assert.equal(
            await client.hIncrByFloat('key', 'field', 1.5),
            '1.5'
        );
    });
});
