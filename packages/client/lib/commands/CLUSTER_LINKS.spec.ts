import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_LINKS';

describe('CLUSTER LINKS', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'LINKS']
        );
    });

    testUtils.testWithCluster('clusterNode.clusterLinks', async cluster => {
        const client = await cluster.nodeClient(cluster.masters[0]),
            links = await client.clusterLinks();
        assert.ok(Array.isArray(links));
        for (const link of links) {
            assert.equal(typeof link.direction, 'string');
            assert.equal(typeof link.node, 'string');
            assert.equal(typeof link.createTime, 'number');
            assert.equal(typeof link.events, 'string');
            assert.equal(typeof link.sendBufferAllocated, 'number');
            assert.equal(typeof link.sendBufferUsed, 'number');
        }
    }, GLOBAL.CLUSTERS.OPEN);
});
