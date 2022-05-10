import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SINTERCARD';

describe('SINTERCARD', () => {
    testUtils.isVersionGreaterThanHook([7]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['SINTERCARD', '2', '1', '2']
            );
        });

        it('with limit', () => {
            assert.deepEqual(
                transformArguments(['1', '2'], 1),
                ['SINTERCARD', '2', '1', '2', 'LIMIT', '1']
            );
        });
    });

    testUtils.testWithClient('client.sInterCard', async client => {
        assert.deepEqual(
            await client.sInterCard('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
