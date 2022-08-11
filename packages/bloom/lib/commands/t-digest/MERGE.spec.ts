import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments, transformReply } from './MERGE';

describe('TDIGEST.MERGE', () => {
    describe('transformArguments', () => {
        describe('srcKeys', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('dest', 'src'),
                    ['TDIGEST.MAX', 'dest', 'src']
                );
            });

            it('Array', () => {
                assert.deepEqual(
                    transformArguments('dest', ['1', '2']),
                    ['TDIGEST.MAX', 'dest', '1,' , '2']
                );
            });
        });
    });

    testUtils.testWithClient('client.tDigest.max', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('src'),
            client.tDigest.merge('dest', 'src')
        ]);

        assert.equal(reply, 'OK');
    }, GLOBAL.SERVERS.OPEN);
});
