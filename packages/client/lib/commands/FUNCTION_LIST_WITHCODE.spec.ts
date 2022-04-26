import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { MATH_FUNCTION, loadMathFunction } from '../client/index.spec';
import { transformArguments } from './FUNCTION_LIST_WITHCODE';

describe('FUNCTION LIST WITHCODE', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['FUNCTION', 'LIST', 'WITHCODE']
            );
        });

        it('with pattern', () => {
            assert.deepEqual(
                transformArguments('patter*'),
                ['FUNCTION', 'LIST', 'patter*', 'WITHCODE']
            );
        });
    });

    testUtils.testWithClient('client.functionListWithCode', async client => {
        await loadMathFunction(client);

        assert.deepEqual(
            await client.functionListWithCode(),
            [{
                libraryName: MATH_FUNCTION.name,
                engine: MATH_FUNCTION.engine,
                functions: [{
                    name: MATH_FUNCTION.library.square.NAME,
                    description: null,
                    flags: ['no-writes']
                }],
                libraryCode: MATH_FUNCTION.code
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
