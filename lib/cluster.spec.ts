import { strict as assert } from 'assert';
import RedisCluster from './cluster';
import { defineScript } from './lua-script';
import { TestRedisClusters, TEST_REDIS_CLUSTERES } from './test-utils';

describe('Cluster', () => {
    it('sendCommand', async () => {
        const cluster = RedisCluster.create({
            rootNodes: TEST_REDIS_CLUSTERES[TestRedisClusters.OPEN],
            useReplicas: true
        });

        await cluster.connect();

        await cluster.ping();
        await cluster.set('a', 'b');
        await cluster.set('a{a}', 'bb');
        await cluster.set('aa', 'bb');
        await cluster.get('aa');
        await cluster.get('aa');
        await cluster.get('aa');
        await cluster.get('aa');

        await cluster.disconnect();
    });

    it('scripts', async () => {
        const cluster = RedisCluster.create({
            rootNodes: TEST_REDIS_CLUSTERES[TestRedisClusters.OPEN],
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
});
