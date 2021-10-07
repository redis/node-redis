import { strict as assert } from 'assert';
import RedisCluster from './cluster';
import { defineScript } from './lua-script';
import { itWithCluster, itWithDedicatedCluster, TestRedisClusters, TEST_REDIS_CLUSTERES } from './test-utils';
import calculateSlot from 'cluster-key-slot';
import { ClusterSlotStates } from './commands/CLUSTER_SETSLOT';

describe('Cluster', () => {
    it('sendCommand', async () => {
        const cluster = RedisCluster.create({
            ...TEST_REDIS_CLUSTERES[TestRedisClusters.OPEN],
            useReplicas: true
        });

        await cluster.connect();

        try {
            await cluster.ping();
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
    });

    itWithCluster(TestRedisClusters.OPEN, 'multi', async cluster => {
        const key = 'key';
        assert.deepEqual(
            await cluster.multi(key)
                .ping()
                .set(key, 'value')
                .get(key)
                .exec(),
            ['PONG', 'OK', 'value']
        );
    });

    it('scripts', async () => {
        const cluster = RedisCluster.create({
            ...TEST_REDIS_CLUSTERES[TestRedisClusters.OPEN],
            scripts: {
                add: defineScript({
                    NUMBER_OF_KEYS: 0,
                    SCRIPT: 'return ARGV[1] + 1;',
                    transformArguments(number: number): Array<string> {
                        assert.equal(number, 1);
                        return [number.toString()];
                    },
                    transformReply(reply: number): number {
                        assert.equal(reply, 2);
                        return reply;
                    }
                })
            }
        });

        await cluster.connect();

        try {
            assert.equal(
                await cluster.add(1),
                2
            );
        } finally {
            await cluster.disconnect();
        }
    });

    itWithDedicatedCluster('should handle live resharding', async cluster => {
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

        // should be able to get the key from the new node
        assert.equal(
            await cluster.get(key),
            value
        );
    });
});
