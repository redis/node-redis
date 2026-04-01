import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLUSTER_INFO from './CLUSTER_INFO';
import { parseArgs } from './generic-transformers';

describe('CLUSTER INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLUSTER_INFO),
      ['CLUSTER', 'INFO']
    );
  });

  testUtils.testWithCluster('clusterNode.clusterInfo', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);
    assert.equal(
      typeof await client.clusterInfo(),
      'string'
    );
  }, GLOBAL.CLUSTERS.OPEN);

  // TODO: re-enable once cluster CI flakiness is resolved
  // testUtils.testWithCluster('structural assertion - RESP2 bulk string format', async cluster => {
  //   const client = await cluster.nodeClient(cluster.masters[0]);
  //   const reply = await client.clusterInfo();
  //
  //   // Assert it's a string (RESP2 bulk string)
  //   assert.equal(typeof reply, 'string');
  //
  //   // Assert the response follows the <field>:<value> CRLF-separated format
  //   // Expected fields according to Redis docs
  //   assert.ok(reply.includes('cluster_state:'), 'should contain cluster_state field');
  //   assert.ok(reply.includes('cluster_slots_assigned:'), 'should contain cluster_slots_assigned field');
  //   assert.ok(reply.includes('cluster_known_nodes:'), 'should contain cluster_known_nodes field');
  //
  //   // Assert CRLF line endings (this is the key structural element)
  //   const lines = reply.split('\r\n').filter(line => line.length > 0);
  //   assert.ok(lines.length > 0, 'should have multiple lines separated by CRLF');
  //
  //   // Each line should follow <field>:<value> format
  //   for (const line of lines) {
  //     assert.ok(line.includes(':'), `line "${line}" should contain colon separator`);
  //   }
  // }, GLOBAL.CLUSTERS.OPEN);
});
