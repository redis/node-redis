import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './WAIT';

describe('WAIT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0, 1),
            ['WAIT', '0', '1']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.wait', async client => {
        assert.equal(
            await client.wait(0, 1),
            0
        );
    });
});
