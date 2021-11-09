import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './COMMAND_INFO';
import { CommandCategories, CommandFlags, CommandReply } from './generic-transformers';

export function assertPingCommand(commandInfo: CommandReply | null | undefined): void {
    assert.deepEqual(
        commandInfo,
        {
            name: 'ping',
            arity: -1,
            flags: new Set([CommandFlags.STALE, CommandFlags.FAST]),
            firstKeyIndex: 0,
            lastKeyIndex: 0,
            step: 0,
            categories: new Set(
                testUtils.isVersionGreaterThan([6]) ?
                    [CommandCategories.FAST, CommandCategories.CONNECTION] :
                    []
            )
        }
    );
}

describe('COMMAND INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['PING']),
            ['COMMAND', 'INFO', 'PING']
        );
    });

    testUtils.testWithClient('client.commandInfo', async client => {
        assertPingCommand((await client.commandInfo(['PING']))[0]);
    }, GLOBAL.SERVERS.OPEN);
});
