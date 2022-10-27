import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments, transformReply } from './MIN';

describe('TDIGEST.MIN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TDIGEST.MIN', 'key']
        );
    });

    testUtils.testWithClient('client.tDigest.min', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.min('key')
        ]);

        assert.equal(reply, NaN);
    }, GLOBAL.SERVERS.OPEN);
});
