import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INFO';

describe('CF INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('cuckoo'),
            ['CF.INFO', 'cuckoo']
        );
    });

    testUtils.testWithClient('client.cf.info', async client => {
        await client.cf.reserve('key', 4);

        const info = await client.cf.info('key');
        assert.equal(typeof info, 'object');
        assert.equal(typeof info.size, 'number');
        assert.equal(typeof info.numberOfBuckets, 'number');
        assert.equal(typeof info.numberOfFilters, 'number');
        assert.equal(typeof info.numberOfInsertedItems, 'number');
        assert.equal(typeof info.numberOfDeletedItems, 'number');
        assert.equal(typeof info.bucketSize, 'number');
        assert.equal(typeof info.expansionRate, 'number');
        assert.equal(typeof info.maxIteration, 'number');
    }, GLOBAL.SERVERS.OPEN);
});
