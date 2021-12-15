import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MAX';

describe('TDIGEST MAX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('tDigest'),
            ['TDIGEST.MAX', 'tDigest']
        );
    });

    testUtils.testWithClient('client.tdigest.max', async client => {
        await Promise.all([
            client.bf.create('tDigest', 100),
            client.bf.add('tDigest', {1: 10, 2: 20})
        ])
        assert.equal(
            await client.bf.max('tDigest'), '20'
        );
    }, GLOBAL.SERVERS.OPEN);
});
