import { strict as assert } from 'assert';
import { MATH_FUNCTION, loadMathFunction } from '../client/index.spec';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_DELETE';

describe('FUNCTION DELETE', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('library'),
            ['FUNCTION', 'DELETE', 'library']
        );
    });

    testUtils.testWithClient('client.functionDelete', async client => {
        await loadMathFunction(client);

        assert.equal(
            await client.functionDelete(MATH_FUNCTION.name),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
