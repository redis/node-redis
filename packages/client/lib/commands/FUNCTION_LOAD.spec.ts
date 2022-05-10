import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { MATH_FUNCTION } from '../client/index.spec';
import { transformArguments } from './FUNCTION_LOAD';

describe('FUNCTION LOAD', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments( 'code'),
                ['FUNCTION', 'LOAD', 'code']
            );
        });

        it('with REPLACE', () => {
            assert.deepEqual(
                transformArguments('code', {
                    REPLACE: true
                }),
                ['FUNCTION', 'LOAD', 'REPLACE', 'code']
            );
        });
    });

    testUtils.testWithClient('client.functionLoad', async client => {
        assert.equal(
            await client.functionLoad(
                MATH_FUNCTION.code,
                { REPLACE: true }
            ),
            MATH_FUNCTION.name
        );
    }, GLOBAL.SERVERS.OPEN);
});
