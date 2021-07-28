import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './PUBSUB_CHANNELS';

describe('PUBSUB CHANNELS', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['PUBSUB', 'CHANNELS']
            );
        });

        it('with pattern', () => {
            assert.deepEqual(
                transformArguments('patter*'),
                ['PUBSUB', 'CHANNELS', 'patter*']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.pubSubChannels', async client => {
        assert.deepEqual(
            await client.pubSubChannels(),
            []
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.pubSubChannels', async cluster => {
        assert.deepEqual(
            await cluster.pubSubChannels(),
            []
        );
    });
});
