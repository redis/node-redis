import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './DBSIZE';

describe('DBSIZE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['DBSIZE']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.dbSize', async client => {
        assert.equal(
            await client.dbSize(),
            0
        );
    });
});
