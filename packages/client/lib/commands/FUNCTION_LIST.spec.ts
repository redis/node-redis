import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { MATH_FUNCTION, loadMathFunction } from '../client/index.spec';
import { transformArguments } from './FUNCTION_LIST';

describe('FUNCTION LIST', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['FUNCTION', 'LIST']
            );
        });

        it('with pattern', () => {
            assert.deepEqual(
                transformArguments('patter*'),
                ['FUNCTION', 'LIST', 'patter*']
            );
        });
    });

    testUtils.testWithClient('client.functionList', async client => {
        await loadMathFunction(client);

        assert.deepEqual(
            await client.functionList(),
            [{
                libraryName: MATH_FUNCTION.name,
                engine: MATH_FUNCTION.engine,
                functions: [{
                    name: MATH_FUNCTION.library.square.NAME,
                    description: null,
                    flags: ['no-writes']
                }]
            }]
        );
    }, GLOBAL.SERVERS.OPEN);
});
