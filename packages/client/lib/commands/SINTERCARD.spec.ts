import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SINTERCARD';

describe('SINTERCARD', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(['set1', 'set2']),
                ['SINTERCARD', '2', 'set1', 'set2']
            );
        });

        it('with limit', () => {
            assert.deepEqual(
                transformArguments(['set1', 'set2'], 1),
                ['SINTERCARD', '2', 'set1', 'set2', 'LIMIT', '1']
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
