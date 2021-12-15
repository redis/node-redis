import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './CDF';

describe('TDIGEST CDF', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('tDigest', 10),
            ['TDIGEST.CDF', 'tDigest', '10']
        );
    });

    testUtils.testWithClient('client.tdigest.cdf', async client => {
        await client.bf.create('tDigest', 100)

        assert.equal(
            await client.bf.cdf('tDigest', 10), '0.0'
        );
    }, GLOBAL.SERVERS.OPEN);
});
