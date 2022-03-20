import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './BITPOS';

describe('BITPOS', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['BITPOS', 'key', '1']
            );
        });

        it('with start', () => {
            assert.deepEqual(
                transformArguments('key', 1, 1),
                ['BITPOS', 'key', '1', '1']
            );
        });

        it('with start and end', () => {
            assert.deepEqual(
                transformArguments('key', 1, 1, -1),
                ['BITPOS', 'key', '1', '1', '-1']
            );
        });

        it('with start, end and mode', () => {
            assert.deepEqual(
                transformArguments('key', 1, 1, -1, 'BIT'),
                ['BITPOS', 'key', '1', '1', '-1', 'BIT']
            );
        });
    });

    testUtils.testWithClient('client.bitPos', async client => {
        assert.equal(
            await client.bitPos('key', 1, 1),
            -1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.bitPos', async cluster => {
        assert.equal(
            await cluster.bitPos('key', 1, 1),
            -1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
