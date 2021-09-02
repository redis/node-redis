import { strict as assert } from 'assert';
import { itWithClient, TestRedisServers } from '../test-utils';
import { transformArguments } from './SWAPDB';

describe('SWAPDB', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0, 1),
            ['SWAPDB', '0', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.swapDb', async client => {
        assert.equal(
            await client.swapDb(0, 1),
            'OK'
        );
    });
});
