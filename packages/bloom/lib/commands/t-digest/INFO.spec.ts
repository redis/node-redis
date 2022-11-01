import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INFO';

describe('TDIGEST.INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TDIGEST.INFO', 'key']
        );
    });

    testUtils.testWithClient('client.tDigest.info', async client => {
        await client.tDigest.create('key');

        const info = await client.tDigest.info('key');
        assert(typeof info.capacity, 'number');
        assert(typeof info.mergedNodes, 'number');
        assert(typeof info.unmergedNodes, 'number');
        assert(typeof info.mergedWeight, 'number');
        assert(typeof info.unmergedWeight, 'number');
        assert(typeof info.totalCompression, 'number');
        assert(typeof info.totalCompression, 'number');
    }, GLOBAL.SERVERS.OPEN);
});
