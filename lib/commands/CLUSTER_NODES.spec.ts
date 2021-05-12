import { strict as assert } from 'assert';
import {RedisClusterNodeLinkStates, transformArguments, transformReply} from './CLUSTER_NODES.js';

describe('CLUSTER NODES', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'NODES']
        );
    });

    describe('transformReply', () => {
        it('simple', () => {
            assert.deepEqual(
                transformReply([
                    'master 127.0.0.1:30001@31001 myself,master - 0 0 1 connected 0-16384',
                    'slave 127.0.0.1:30002@31002 slave master 0 0 1 connected',
                    ''
                ].join('\n')),
                [{
                    id: 'master',
                    url: '127.0.0.1:30001@31001',
                    flags: ['myself', 'master'],
                    master: null,
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 1,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [{
                        from: 0,
                        to: 16384
                    }]
                }, {
                    id: 'slave',
                    url: '127.0.0.1:30002@31002',
                    flags: ['slave'],
                    master: 'master',
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 1,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: []
                }]
            );
        });

        it.skip('with importing slots', () => {
            assert.deepEqual(
                transformReply(
                    'id 127.0.0.1:30001@31001 master - 0 0 0 connected 0-<-16384'
                ),
                [{
                    id: 'id',
                    url: '127.0.0.1:30001@31001',
                    flags: ['master'],
                    master: null,
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 0,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [] // TODO
                }]
            );
        });

        it.skip('with migrating slots', () => {
            assert.deepEqual(
                transformReply(
                    'id 127.0.0.1:30001@31001 master - 0 0 0 connected 0->-16384'
                ),
                [{
                    id: 'id',
                    url: '127.0.0.1:30001@31001',
                    flags: ['master'],
                    master: null,
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 0,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [] // TODO
                }]
            );
        });
    });
});
