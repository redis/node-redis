import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { MATH_FUNCTION } from '../client/index.spec';
import { RedisFunctionEngines, transformArguments } from './FUNCTION_LOAD';

describe('FUNCTION LOAD', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(RedisFunctionEngines.LUA, 'library', 'code'),
                ['FUNCTION', 'LOAD', 'LUA', 'library', 'code']
            );
        });

        it('with REPLACE', () => {
            assert.deepEqual(
                transformArguments(RedisFunctionEngines.LUA, 'library', 'code', {
                    REPLACE: true
                }),
                ['FUNCTION', 'LOAD', 'LUA', 'library', 'REPLACE', 'code']
            );
        });

        it('with DESCRIPTION', () => {
            assert.deepEqual(
                transformArguments(RedisFunctionEngines.LUA, 'library', 'code', {
                    DESCRIPTION: 'description'
                }),
                ['FUNCTION', 'LOAD', 'LUA', 'library', 'DESCRIPTION', 'description', 'code']
            );
        });
    });

    testUtils.testWithClient('client.functionLoad', async client => {
        assert.equal(
            await client.functionLoad(
                MATH_FUNCTION.engine,
                'math',
                MATH_FUNCTION.code,
                { REPLACE: true }
            ),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
