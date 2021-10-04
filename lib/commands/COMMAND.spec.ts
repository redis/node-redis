import { strict as assert } from 'assert';
import { itWithClient, TestRedisServers } from '../test-utils';
import { transformArguments } from './COMMAND';
import { CommandCategories, CommandFlags } from './generic-transformers';

describe('COMMAND', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['COMMAND']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.command', async client => {
        assert.deepEqual(
            (await client.command()).find(command => command.name === 'ping'),
            {
                name: 'ping',
                arity: -1,
                flags: new Set([CommandFlags.STALE, CommandFlags.FAST]),
                firstKeyIndex: 0,
                lastKeyIndex: 0,
                step: 0,
                categories: new Set([CommandCategories.FAST, CommandCategories.CONNECTION])
            }
        );
    }, {
        minimumRedisVersion: [6]
    });
});
