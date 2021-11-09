import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './COMMAND_COUNT';

describe('COMMAND COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['COMMAND', 'COUNT']
        );
    });

    testUtils.testWithClient('client.commandCount', async client => {
        assert.equal(
            typeof await client.commandCount(),
            'number'
        );
    }, GLOBAL.SERVERS.OPEN);
});
