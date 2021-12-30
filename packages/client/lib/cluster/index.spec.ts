import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import RedisCluster from '.';
import { ClusterSlotStates } from '../commands/CLUSTER_SETSLOT';
import { SQUARE_SCRIPT } from '../client/index.spec';
import { RootNodesUnavailableError } from '../errors';

// We need to use 'require', because it's not possible with Typescript to import
// function that are exported as 'module.exports = function`, without esModuleInterop
// set to true.
const calculateSlot = require('cluster-key-slot');

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
        const key = 'key',
            value = 'value';
        await cluster.set(key, value);

        const slot = calculateSlot(key),
            source = cluster.getSlotMaster(slot),
            destination = cluster.getMasters().find(node => node.id !== source.id)!;

        await Promise.all([
            source.client.clusterSetSlot(slot, ClusterSlotStates.MIGRATING, destination.id),
            destination.client.clusterSetSlot(slot, ClusterSlotStates.IMPORTING, destination.id)
        ]);

        // should be able to get the key from the source node using "ASKING"
        assert.equal(
            await cluster.get(key),
            value
        );

        await Promise.all([
            source.client.migrate(
                '127.0.0.1',
                (<any>destination.client.options).socket.port,
                key,
                0,
                10
            )
        ]);

        // should be able to get the key from the destination node using the "ASKING" command
        assert.equal(
            await cluster.get(key),
            value
        );

        await Promise.all(
            cluster.getMasters().map(({ client }) => {
                return client.clusterSetSlot(slot, ClusterSlotStates.NODE, destination.id);
            })
        );

        // should handle "MOVED" errors
        assert.equal(
            await cluster.get(key),
            value
        );
    }, {
        serverArguments: [],
        numberOfNodes: 2
    });
});
