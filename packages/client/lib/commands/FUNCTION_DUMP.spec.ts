import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_DUMP';

describe('FUNCTION DUMP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['FUNCTION', 'DUMP']
        );
    });

    testUtils.testWithClient('client.functionDump', async client => {
        console.log(await client.functionDump());
    }, GLOBAL.SERVERS.OPEN);
});
