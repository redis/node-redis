import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './COMMAND_DOCS';

describe('COMMAND DOCS', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);
    
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('SORT'),
            ['COMMAND', 'DOCS', 'SORT']
        );
    });

    testUtils.testWithClient('client.commandDocs', async client => {
        assert.deepEqual(
            await client.commandDocs('sort'),
            [[
                'sort', 
                {
                    summary: 'Sort the elements in a list, set or sorted set',
                    since: '1.0.0',
                    group: 'generic',
                    complexity: 'O(N+M*log(M)) where N is the number of elements in the list or set to sort, and M the number of returned elements. When the elements are not sorted, complexity is O(N).',
                    history: null
                }
            ]]
        );
    }, GLOBAL.SERVERS.OPEN);
});
