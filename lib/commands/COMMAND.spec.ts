import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './COMMAND';
import { assertPingCommand } from './COMMAND_INFO.spec';

describe('COMMAND', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['COMMAND']
        );
    });

    testUtils.testWithClient('client.command', async client => {
        assertPingCommand((await client.command()).find(command => command.name === 'ping'));
    }, GLOBAL.SERVERS.OPEN);
});
