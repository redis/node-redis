import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './QUANTILE';

describe('TDIGEST QUANTILE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('tDigest', 1),
            ['TDIGEST.QUANTILE', 'tDigest', '1']
        );
    });

    testUtils.testWithClient('client.tdigest.quantile', async client => {
        await Promise.all([
            client.bf.create('tDigest', 100),
            client.bf.add('tDigest', {1: 10, 2: 20})
        ])
        assert.equal(
            await client.bf.quantile('tDigest', 1), '20'
        );
    }, GLOBAL.SERVERS.OPEN);
});
