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

    describe('transformReply', () => {
        it('DBL_MAX', () => {
            assert.equal(
                transformReply('DBL_MAX'),
                Infinity
            );
        });

        it('0', () => {
            assert.equal(
                transformReply('0'),
                0
            );
        });
    });

    testUtils.testWithClient('client.tDigest.min', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('key'),
            client.tDigest.min('key')
        ]);

        assert.equal(reply, Infinity);
    }, GLOBAL.SERVERS.OPEN);
});
