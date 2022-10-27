import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './BYREVRANK';

describe('TDIGEST.BYREVRANK', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', [1, 2]),
            ['TDIGEST.BYREVRANK', 'key', '1', '2']
        );
    });

    testUtils.testWithClient('client.tDigest.byRevRank', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.byRevRank('key', [1])
        ]);

        assert.deepEqual(reply, [NaN]);
    }, GLOBAL.SERVERS.OPEN);
});
