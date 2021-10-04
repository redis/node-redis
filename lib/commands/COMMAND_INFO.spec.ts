import { strict as assert } from 'assert';
import { itWithClient, TestRedisServers } from '../test-utils';
import { transformArguments } from './COMMAND_INFO';
import { CommandCategories, CommandFlags } from './generic-transformers';

describe('COMMAND INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['PING']),
            ['COMMAND', 'INFO', 'PING']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.commandInfo', async client => {
        assert.deepEqual(
            await client.commandInfo(['PING']),
            [{
                name: 'ping',
                arity: -1,
                flags: new Set([CommandFlags.STALE, CommandFlags.FAST]),
                firstKeyIndex: 0,
                lastKeyIndex: 0,
                step: 0,
                categories: new Set([CommandCategories.FAST, CommandCategories.CONNECTION])
            }]
        );
    });
});
