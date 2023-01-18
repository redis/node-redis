import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments, transformReply } from './MAX';

describe('TDIGEST.MAX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TDIGEST.MAX', 'key']
        );
    });

    testUtils.testWithClient('client.tDigest.max', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.max('key')
        ]);

        assert.deepEqual(reply, NaN);
    }, GLOBAL.SERVERS.OPEN);
});
