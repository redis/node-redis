import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_RESTORE';

describe('FUNCTION RESTORE', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('dump'),
                ['FUNCTION', 'RESTORE', 'dump']
            );
        });

        it('with mode', () => {
            assert.deepEqual(
                transformArguments('dump', 'APPEND'),
                ['FUNCTION', 'RESTORE', 'dump', 'APPEND']
            );
        });
    });

    testUtils.testWithClient('client.functionRestore', async client => {
        assert.equal(
            await client.functionRestore(
                await client.functionDump(
                    client.commandOptions({
                        returnBuffers: true
                    })
                ),
                'FLUSH'
            ),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
