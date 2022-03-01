import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, FilterBy } from './COMMAND_LIST';

describe('COMMAND LIST', () => {
    testUtils.isVersionGreaterThanHook([7,0]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['COMMAND', 'LIST']
        );
    });

    it('transformArguments FILTERBY MODULE', () => {
        assert.deepEqual(
            transformArguments(FilterBy.MODULE, "json"),
            ['COMMAND', 'LIST', 'FILTERBY', 'MODULE', 'json']
        );
    });

    it('transformArguments FILTERBY ACLCAT', () => {
        assert.deepEqual(
            transformArguments(FilterBy.ACLCAT, "admin"),
            ['COMMAND', 'LIST', 'FILTERBY', 'ACLCAT', 'admin']
        );
    });

    it('transformArguments FILTERBY PATTERN', () => {
        assert.deepEqual(
            transformArguments(FilterBy.PATTERN, "a*"),
            ['COMMAND', 'LIST', 'FILTERBY', 'PATTERN', 'a*']
        );
    });

    testUtils.testWithClient('client.commandList', async client => {
        assert.equal(
            typeof await client.commandList(),
            'Array<String>'
        );
    }, GLOBAL.SERVERS.OPEN);
});
