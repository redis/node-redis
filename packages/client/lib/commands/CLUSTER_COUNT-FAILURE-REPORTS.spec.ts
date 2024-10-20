import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_COUNT_FAILURE_REPORTS from './CLUSTER_COUNT-FAILURE-REPORTS';
import { parseArgs } from './generic-transformers';

describe('CLUSTER COUNT-FAILURE-REPORTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_COUNT_FAILURE_REPORTS, '0'),
      ['CLUSTER', 'COUNT-FAILURE-REPORTS', '0']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterCountFailureReports', async cluster => {
    const [master] = cluster.masters,
      client = await cluster.nodeClient(master);
    assert.equal(
      typeof await client.clusterCountFailureReports(master.id),
      'number'
    );
  }, GLOBAL.CLUSTERS.OPEN);
});
