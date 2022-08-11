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

    describe('transformReply', () => {
        it('DBL_MIN', () => {
            assert.equal(
                transformReply('DBL_MIN'),
                -Infinity
            );
        });

        it('0', () => {
            assert.equal(
                transformReply('0'),
                0
            );
        });
    });

    testUtils.testWithClient('client.tDigest.max', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.max('key')
        ]);

        assert.equal(reply, -Infinity);
    }, GLOBAL.SERVERS.OPEN);
});
