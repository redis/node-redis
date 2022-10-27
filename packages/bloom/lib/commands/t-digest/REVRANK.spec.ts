import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './REVRANK';

describe('TDIGEST.REVRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', [1, 2]),
            ['TDIGEST.REVRANK', 'key', '1', '2']
        );
    });

    testUtils.testWithClient('client.tDigest.revRank', async client => {
        assert.equal(
            await client.tDigest.revRank('key', [1]),
            [-2]
        );
    }, GLOBAL.SERVERS.OPEN);
});
