import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_DUMP';

describe('FUNCTION DUMP', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['FUNCTION', 'DUMP']
        );
    });

    testUtils.testWithClient('client.functionDump', async client => {
        assert.equal(
            typeof await client.functionDump(),
            'string'
        );
    }, GLOBAL.SERVERS.OPEN);
});
