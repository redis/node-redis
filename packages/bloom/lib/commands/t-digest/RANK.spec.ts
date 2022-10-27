import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './RANK';

describe('TDIGEST.RANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', [1, 2]),
            ['TDIGEST.RANK', 'key', '1', '2']
        );
    });

    testUtils.testWithClient('client.tDigest.rank', async client => {
        assert.equal(
            await client.tDigest.rank('key', [1]),
            [-2]
        );
    }, GLOBAL.SERVERS.OPEN);
});
