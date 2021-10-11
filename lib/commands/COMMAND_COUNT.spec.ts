import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './COMMAND_COUNT';

describe('COMMAND COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['COMMAND', 'COUNT']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.commandCount', async client => {
        assert.equal(
            typeof await client.commandCount(),
            'number'
        );
    });
});
