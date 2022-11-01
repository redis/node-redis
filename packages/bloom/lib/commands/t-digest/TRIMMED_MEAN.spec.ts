import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments,  transformReply } from './TRIMMED_MEAN';

describe('TDIGEST.RESET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, 1),
            ['TDIGEST.TRIMMED_MEAN', 'key', '0', '1']
        );
    });

    testUtils.testWithClient('client.tDigest.trimmedMean', async client => {
        const [, reply] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.trimmedMean('key', 0, 1)
        ]);

        assert.equal(reply, NaN);
    }, GLOBAL.SERVERS.OPEN);
});
