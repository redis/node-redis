import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './COMMAND_GETKEYSANDFLAGS';

describe('COMMAND GETKEYSANDFLAGS', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(['GET', 'key']),
            ['COMMAND', 'GETKEYSANDFLAGS', 'GET', 'key']
        );
    });

    testUtils.testWithClient('client.commandGetKeysAndFlags', async client => {
        assert.deepEqual(
            await client.commandGetKeysAndFlags(['GET', 'key']),
            [{
                key: 'key',
                flags: ['RO', 'access']
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
