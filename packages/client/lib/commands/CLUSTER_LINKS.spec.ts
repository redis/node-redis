import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CLUSTER_LINKS';

describe('CLUSTER LINKS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'LINKS']
        );
    });

    testUtils.isVersionGreaterThanHook([7, 0]);
    
    testUtils.testWithCluster('clusterNode.clusterSaveConfig', async cluster => {
        const links = await cluster.getSlotMaster(0).client.clusterLinks();

        assert.notEqual(links, null);
        assert.equal(typeof links[0].node, 'string');

    }, GLOBAL.CLUSTERS.OPEN);
});
