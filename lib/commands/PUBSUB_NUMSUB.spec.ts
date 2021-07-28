import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './PUBSUB_NUMSUB';

describe('PUBSUB NUMSUB', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['PUBSUB', 'NUMSUB']
            );
        });

        it('string', () => {
            assert.deepEqual(
                transformArguments('channel'),
                ['PUBSUB', 'NUMSUB', 'channel']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['PUBSUB', 'NUMSUB', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.pubSubNumSub', async client => {
        assert.deepEqual(
            await client.pubSubNumSub(),
            Object.create(null)
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.pubSubNumPat', async cluster => {
        assert.deepEqual(
            await cluster.pubSubNumSub(),
            Object.create(null)
        );
    });
});
