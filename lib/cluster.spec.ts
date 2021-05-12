import RedisCluster from './cluster.js';

describe.skip('Cluster', () => {
    it('sendCommand', async () => {
        const cluster = RedisCluster.create({
            rootNodes: [{
                port: 30001
            }]
        });

        await cluster.connect();

        await cluster.ping();
        await cluster.set('a', 'b');
        await cluster.set('a{a}', 'bb');
        await cluster.set('aa', 'bb');

        await cluster.disconnect();
    });
});
