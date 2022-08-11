import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './RESET';

describe('TDIGEST.QUANTILE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TDIGEST.QUANTILE', 'key']
        );
    });

    testUtils.testWithClient('client.tDigest.quantile', async client => {
        const [, reply] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.quantile('key', [1, 2])
        ]);

        assert.deepEqual(
            reply,
            [
                Infinity,
                Infinity
            ]
        );
    }, GLOBAL.SERVERS.OPEN);
});
