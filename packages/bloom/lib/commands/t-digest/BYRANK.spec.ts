import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './BYRANK';

describe('TDIGEST.BYRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', [1, 2]),
            ['TDIGEST.BYRANK', 'key', '1', '2']
        );
    });

    testUtils.testWithClient('client.tDigest.byRank', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.byRank('key', [1])
        ]);

        assert.deepEqual(reply, [NaN]);
    }, GLOBAL.SERVERS.OPEN);
});
