import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZINTERCARD';

describe('ZINTERCARD', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['ZINTERCARD', '2', '1', '2']
            );
        });

        it('with limit', () => {
            assert.deepEqual(
                transformArguments(['1', '2'], 1),
                ['ZINTERCARD', '2', '1', '2', 'LIMIT', '1']
            );
        });
    });

    testUtils.testWithClient('client.zInterCard', async client => {
        assert.deepEqual(
            await client.zInterCard('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
