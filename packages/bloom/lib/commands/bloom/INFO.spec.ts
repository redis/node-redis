import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INFO';

describe('BF INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('bloom'),
            ['BF.INFO', 'bloom']
        );
    });

    testUtils.testWithClient('client.bf.info', async client => {
        await client.bf.reserve('bloom', { errorRate: 0.01, capacity: 100 });

        assert.deepEqual(
            await client.bf.info('bloom'),
            {
                capacity: 100,
                size: 296,
                numberOfFilters: 1,
                numberOfInsertedItems: 0,
                expansionRate: 2
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
