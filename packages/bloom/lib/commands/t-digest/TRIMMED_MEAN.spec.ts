import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments,  transformReply } from './RESET';

describe('TDIGEST.RESET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TDIGEST.RESET', 'key']
        );
    });

    describe('transformReply', () => {
        it('number', () => {
            assert.deepEqual(
                transformReply('0'),
                0
            );
        });

        it('DBL_MAX', () => {
            assert.deepEqual(
                transformReply('DBL_MAX'),
                Infinity
            );
        });
    })

    testUtils.testWithClient('client.tDigest.trimmedMean', async client => {
        const [, reply] = await Promise.all([
            client.tDigest.create('key', 100),
            client.tDigest.trimmedMean('key')
        ]);

        assert.equal(reply, Infinity);
    }, GLOBAL.SERVERS.OPEN);
});
