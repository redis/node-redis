import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MERGESTORE';

describe('TDIGEST.MERGESTORE', () => {
    describe('transformArguments', () => {
        describe('srcKeys', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('dest', ['1', '2']),
                    ['TDIGEST.MERGESTORE', 'dest', '1', '1', '2']
                );
            });

            it('Array', () => {
                assert.deepEqual(
                    transformArguments('dest', 'src'),
                    ['TDIGEST.MERGESTORE', 'dest', '1', 'src']
                );
            });
        });

        it('with COMPRESSION', () => {
            assert.deepEqual(
                transformArguments('dest', 'src', {
                    COMPRESSION: 100
                }),
                ['TDIGEST.MERGESTORE', 'dest', '1', 'src', 'COMPRESSION', '100']
            );
        });
    });

    testUtils.testWithClient('client.tDigest.mergeStore', async client => {
        assert.equal(
            await client.tDigest.mergeStore('dest', 'src'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
