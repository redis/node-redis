import RedisCluster from './cluster';

describe.skip('Cluster', () => {
    it('sendCommand', async () => {
        const cluster = RedisCluster.create({
            rootNodes: [{
                port: 30001
            }],
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
});
