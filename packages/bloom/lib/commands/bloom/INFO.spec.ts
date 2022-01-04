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
        await client.bf.reserve('key', 0.01, 100);

        const info = await client.bf.info('key');
        assert.equal(typeof info, 'object');
        assert.equal(info.capacity, 100);
        assert.equal(typeof info.size, 'number');
        assert.equal(typeof info.numberOfFilters, 'number');
        assert.equal(typeof info.numberOfInsertedItems, 'number');
        assert.equal(typeof info.expansionRate, 'number');
    }, GLOBAL.SERVERS.OPEN);
});
