import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments, transformReply } from './MERGE';

describe('TDIGEST.MERGE', () => {
    describe('transformArguments', () => {
        describe('srcKeys', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('dest', 'src'),
                    ['TDIGEST.MERGE', 'dest', '1', 'src']
                );
            });

            it('Array', () => {
                assert.deepEqual(
                    transformArguments('dest', ['1', '2']),
                    ['TDIGEST.MERGE', 'dest', '2', '1', '2']
                );
            });
        });

        it('with COMPRESSION', () => {
            assert.deepEqual(
                transformArguments('dest', 'src', {
                    COMPRESSION: 100
                }),
                ['TDIGEST.MERGE', 'dest', '1', 'src', 'COMPRESSION', '100']
            );
        });

        it('with OVERRIDE', () => {
            assert.deepEqual(
                transformArguments('dest', 'src', {
                    OVERRIDE: true
                }),
                ['TDIGEST.MERGE', 'dest', '1', 'src', 'OVERRIDE']
            );
        });
    });

    testUtils.testWithClient('client.tDigest.merge', async client => {
        const [ , reply ] = await Promise.all([
            client.tDigest.create('src'),
            client.tDigest.merge('dest', 'src')
        ]);

        assert.equal(reply, 'OK');
    }, GLOBAL.SERVERS.OPEN);
});
