import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './CDF';

describe('TDIGEST.CDF', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['TDIGEST.CDF', 'key', '1']
        );
    });

    testUtils.testWithClient('client.tDigest.cdf', async client => {
        assert.equal(
            await client.tDigest.cdf('key', '1'),
            NaN
        );
    }, GLOBAL.SERVERS.OPEN);
});
