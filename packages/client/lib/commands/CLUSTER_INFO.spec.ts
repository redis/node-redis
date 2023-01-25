import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './CLUSTER_INFO';

describe('CLUSTER INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'INFO']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([
                'cluster_state:ok',
                'cluster_slots_assigned:16384',
                'cluster_slots_ok:16384',
                'cluster_slots_pfail:0',
                'cluster_slots_fail:0',
                'cluster_known_nodes:6',
                'cluster_size:3',
                'cluster_current_epoch:6',
                'cluster_my_epoch:2',
                'cluster_stats_messages_sent:1483972',
                'cluster_stats_messages_received:1483968'
            ].join('\r\n')),
            {
                state: 'ok',
                slots: {
                    assigned: 16384,
                    ok: 16384,
                    pfail: 0,
                    fail: 0
                },
                knownNodes: 6,
                size: 3,
                currentEpoch: 6,
                myEpoch: 2,
                stats: {
                    messagesSent: 1483972,
                    messagesReceived: 1483968
                }
            }
        );
    });

    testUtils.testWithCluster('clusterNode.clusterInfo', async cluster => {
        const client = await cluster.nodeClient(cluster.masters[0]);
        assert.notEqual(
            await client.clusterInfo(),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
