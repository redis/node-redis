import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MIN';

describe('TDIGEST MIN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('tDigest'),
            ['TDIGEST.MIN', 'tDigest']
        );
    });

    testUtils.testWithClient('client.tdigest.min', async client => {
        await Promise.all([
            client.bf.create('tDigest', 100),
            client.bf.add('tDigest', {1: 10, 2: 20})
        ])
        assert.equal(
            await client.bf.min('tDigest'), '20'
        );
    }, GLOBAL.SERVERS.OPEN);
});
