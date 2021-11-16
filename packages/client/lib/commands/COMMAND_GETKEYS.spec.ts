import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './COMMAND_GETKEYS';

describe('COMMAND GETKEYS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['GET', 'key']),
            ['COMMAND', 'GETKEYS', 'GET', 'key']
        );
    });

    testUtils.testWithClient('client.commandGetKeys', async client => {
        assert.deepEqual(
            await client.commandGetKeys(['GET', 'key']),
            ['key']
        );
    }, GLOBAL.SERVERS.OPEN);
});
