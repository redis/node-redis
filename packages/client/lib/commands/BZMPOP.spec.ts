import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BZMPOP';

describe('BZMPOP', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(0, 'key', 'MIN'),
                ['BZMPOP', '0', '1', 'key', 'MIN']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments(0, 'key', 'MIN', {
                    COUNT: 2
                }),
                ['BZMPOP', '0', '1', 'key', 'MIN', 'COUNT', '2']
            );
        });
    });

    testUtils.testWithClient('client.bzmPop', async client => {
        assert.deepEqual(
            await client.bzmPop(1, 'key', 'MAX'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
