import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import calculateSlot from 'cluster-key-slot';
import { ClusterSlotStates } from '../commands/CLUSTER_SETSLOT';
import { SQUARE_SCRIPT } from '../client/index.spec';

describe('Cluster', () => {
    testUtils.testWithCluster('sendCommand', async cluster => {
        await cluster.connect();

        try {
            await cluster.publish('channel', 'message');
            await cluster.set('a', 'b');
            await cluster.set('a{a}', 'bb');
            await cluster.set('aa', 'bb');
            await cluster.get('aa');
            await cluster.get('aa');
            await cluster.get('aa');
            await cluster.get('aa');
        } finally {
            await cluster.disconnect();
        }
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

    testUtils.testWithCluster('should handle live resharding', async cluster => {
        const key = 'key',
            value = 'value';
        await cluster.set(key, value);

        const slot = calculateSlot(key),
            from = cluster.getSlotMaster(slot),
            to = cluster.getMasters().find(node => node.id !== from.id);

        await to!.client.clusterSetSlot(slot, ClusterSlotStates.IMPORTING, from.id);

        // should be able to get the key from the original node before it was migrated
        assert.equal(
            await cluster.get(key),
            value
        );

        await from.client.clusterSetSlot(slot, ClusterSlotStates.MIGRATING, to!.id);

        // should be able to get the key from the original node using the "ASKING" command
        assert.equal(
            await cluster.get(key),
            value
        );

        const { port: toPort } = <any>to!.client.options!.socket;

        await from.client.migrate(
            '127.0.0.1',
            toPort,
            key,
            0,
            10
        );

        await Promise.all(
            cluster.getMasters().map(({ client }) => {
                return client.clusterSetSlot(slot, ClusterSlotStates.NODE, to!.id);
            })
        );

        // should be able to get the key from the new node
        assert.equal(
            await cluster.get(key),
            value
        );
    }, {
        serverArguments: [],
        numberOfNodes: 2
    });
});
