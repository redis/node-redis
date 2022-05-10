import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_FLUSH';

describe('FUNCTION FLUSH', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['FUNCTION', 'FLUSH']
            );
        });

        it('with mode', () => {
            assert.deepEqual(
                transformArguments('SYNC'),
                ['FUNCTION', 'FLUSH', 'SYNC']
            );
        });
    });

    testUtils.testWithClient('client.functionFlush', async client => {
        assert.equal(
            await client.functionFlush(),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
