import { strict as assert } from 'assert';
import testUtils, { GLOBAL, waitTillBeenCalled } from '../test-utils';
import RedisCluster from '.';
import { ClusterSlotStates } from '../commands/CLUSTER_SETSLOT';
import { SQUARE_SCRIPT } from '../client/index.spec';
import { RootNodesUnavailableError } from '../errors';
import { spy } from 'sinon';
import { promiseTimeout } from '../utils';

describe('Cluster', () => {
    testUtils.testWithCluster('sendCommand', async cluster => {
        await cluster.publish('channel', 'message');
        await cluster.set('a', 'b');
        await cluster.set('a{a}', 'bb');
        await cluster.set('aa', 'bb');
        await cluster.get('aa');
        await cluster.get('aa');
        await cluster.get('aa');
        await cluster.get('aa');
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('should spread the load across the cluster', async cluster => {

    }, GLOBAL.CLUSTERS.OPEN);


    testUtils.testWithCluster('multi', async cluster => {
        const key = 'key';
        assert.deepEqual(
            await cluster.multi()
                .set(key, 'value')
                .get(key)
                .exec(),
            ['OK', 'value']
        );
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('scripts', async cluster => {
        assert.equal(
            await cluster.square(2),
            4
        );
    }, {
        ...GLOBAL.CLUSTERS.OPEN,
        clusterConfiguration: {
            scripts: {
                square: SQUARE_SCRIPT
            }
        }
    });

    it('should throw RootNodesUnavailableError', async () => {
        const cluster = RedisCluster.create({
            rootNodes: []
        });

        try {
            await assert.rejects(
                cluster.connect(),
                RootNodesUnavailableError
            );
        } catch (err) {
            await cluster.disconnect();
            throw err;
        }
    });

    testUtils.testWithCluster('should handle live resharding', async cluster => {
        const slot = 12539,
            key = 'key',
            value = 'value';
        await cluster.set(key, value);

        const importing = cluster.slots[0].master,
            migrating = cluster.slots[slot].master,
            [ importingClient, migratingClient ] = await Promise.all([
                cluster.nodeClient(importing),
                cluster.nodeClient(migrating)
            ]);

        await Promise.all([
            importingClient.clusterSetSlot(slot, ClusterSlotStates.IMPORTING, migrating.id),
            migratingClient.clusterSetSlot(slot, ClusterSlotStates.MIGRATING, importing.id)
        ]);

        // should be able to get the key from the migrating node
        assert.equal(
            await cluster.get(key),
            value
        );

        await migratingClient.migrate(
            importing.host,
            importing.port,
            key,
            0,
            10
        );

        // should be able to get the key from the importing node using `ASKING`
        assert.equal(
            await cluster.get(key),
            value
        );

        await Promise.all([
            importingClient.clusterSetSlot(slot, ClusterSlotStates.NODE, importing.id),
            migratingClient.clusterSetSlot(slot, ClusterSlotStates.NODE, importing.id),
        ]);

        // should handle `MOVED` errors
        assert.equal(
            await cluster.get(key),
            value
        );
    }, {
        serverArguments: [],
        numberOfNodes: 2
    });

    testUtils.testWithCluster('getRandomNode should spread the the load evenly', async cluster => {
        const totalNodes = cluster.masters.length + cluster.replicas.length,
            ids = new Set<string>();
        for (let i = 0; i < totalNodes; i++) {
            ids.add(cluster.getRandomNode().id);
        }
        
        assert.equal(ids.size, totalNodes);
    }, GLOBAL.CLUSTERS.WITH_REPLICAS);

    testUtils.testWithCluster('getSlotRandomNode should spread the the load evenly', async cluster => {
        const totalNodes = 1 + cluster.slots[0].replicas!.length,
            ids = new Set<string>();
        for (let i = 0; i < totalNodes; i++) {
            ids.add(cluster.getSlotRandomNode(0).id);
        }
        
        assert.equal(ids.size, totalNodes);
    }, GLOBAL.CLUSTERS.WITH_REPLICAS);

    describe('PubSub', () => {
        function assertStringListener(message: string, channel: string) {
            assert.equal(typeof message, 'string');
            assert.equal(typeof channel, 'string');
        }

        testUtils.testWithCluster('should be able to send and receive messages', async cluster => {
            const channelListener = spy(assertStringListener),
                patternListener = spy(assertStringListener);

            await Promise.all([
                cluster.subscribe('channel', channelListener),
                cluster.pSubscribe('channe*', patternListener)
            ]);

            await Promise.all([
                cluster.publish('channel', 'message'),
                waitTillBeenCalled(channelListener),
                waitTillBeenCalled(patternListener)
            ]);
            
            assert.ok(channelListener.calledOnceWithExactly('message', 'channel'));
            assert.ok(patternListener.calledOnceWithExactly('message', 'channel'));
        }, GLOBAL.CLUSTERS.OPEN);

        testUtils.testWithCluster('should move listeners when PubSub node disconnects from the cluster', async cluster => {
            const listener = spy(assertStringListener);
            await cluster.subscribe('channel', listener);

            assert.ok(cluster.pubSubNode);
            const [ migrating, importing ] = cluster.masters[0].address === cluster.pubSubNode.address ?
                    cluster.masters :
                    [cluster.masters[1], cluster.masters[0]],
                [ migratingClient, importingClient ] = await Promise.all([
                    cluster.nodeClient(migrating),
                    cluster.nodeClient(importing)
                ]);

            const range = cluster.slots[0].master === migrating ? {
                key: 'bar', // 5061
                start: 0,
                end: 8191
            } : {
                key: 'foo', // 12182
                start: 8192,
                end: 16383
            };

            await Promise.all([
                migratingClient.clusterDelSlotsRange(range),
                importingClient.clusterDelSlotsRange(range),
                importingClient.clusterAddSlotsRange(range)
            ]);

            // wait for migrating node to be notified about the new topology
            while ((await migratingClient.clusterInfo()).state !== 'ok') {
                await promiseTimeout(50);
            }

            // make sure to cause `MOVED` error
            await cluster.get(range.key);

            await Promise.all([
                cluster.publish('channel', 'message'),
                waitTillBeenCalled(listener)
            ]);
            
            assert.ok(listener.calledOnceWithExactly('message', 'channel'));
        }, {
            serverArguments: [],
            numberOfNodes: 2,
            minimumDockerVersion: [7]
        });
    });
});
