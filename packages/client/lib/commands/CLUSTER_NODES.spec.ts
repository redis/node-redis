import { strict as assert } from 'assert';
import { RedisClusterNodeLinkStates, transformArguments, transformReply } from './CLUSTER_NODES';

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
                    address: '127.0.0.1:30001@31001',
                    host: '127.0.0.1',
                    port: 30001,
                    cport: 31001,
                    flags: ['myself', 'master'],
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 1,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [{
                        from: 0,
                        to: 16384
                    }],
                    replicas: [{
                        id: 'slave',
                        address: '127.0.0.1:30002@31002',
                        host: '127.0.0.1',
                        port: 30002,
                        cport: 31002,
                        flags: ['slave'],
                        pingSent: 0,
                        pongRecv: 0,
                        configEpoch: 1,
                        linkState: RedisClusterNodeLinkStates.CONNECTED
                    }]
                }]
            );
        });

        it('should support addresses without cport', () => {
            assert.deepEqual(
                transformReply(
                    'id 127.0.0.1:30001 master - 0 0 0 connected 0-16384\n'
                ),
                [{
                    id: 'id',
                    address: '127.0.0.1:30001',
                    host: '127.0.0.1',
                    port: 30001,
                    cport: null,
                    flags: ['master'],
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 0,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [{
                        from: 0,
                        to: 16384
                    }],
                    replicas: []
                }]
            );
        });

        it('should support ipv6 addresses', () => {
            assert.deepEqual(
                transformReply(
                    'id 2a02:6b8:c21:330d:0:1589:ebbe:b1a0:6379@16379 master - 0 0 0 connected 0-549\n'
                ),
                [{
                    id: 'id',
                    address: '2a02:6b8:c21:330d:0:1589:ebbe:b1a0:6379@16379',
                    host: '2a02:6b8:c21:330d:0:1589:ebbe:b1a0',
                    port: 6379,
                    cport: 16379,
                    flags: ['master'],
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 0,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [{
                        from: 0,
                        to: 549
                    }],
                    replicas: []
                }]
            );
        });

        it.skip('with importing slots', () => {
            assert.deepEqual(
                transformReply(
                    'id 127.0.0.1:30001@31001 master - 0 0 0 connected 0-<-16384\n'
                ),
                [{
                    id: 'id',
                    address: '127.0.0.1:30001@31001',
                    host: '127.0.0.1',
                    port: 30001,
                    cport: 31001,
                    flags: ['master'],
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 0,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [], // TODO
                    replicas: []
                }]
            );
        });

        it.skip('with migrating slots', () => {
            assert.deepEqual(
                transformReply(
                    'id 127.0.0.1:30001@31001 master - 0 0 0 connected 0->-16384\n'
                ),
                [{
                    id: 'id',
                    address: '127.0.0.1:30001@31001',
                    host: '127.0.0.1',
                    port: 30001,
                    cport: 31001,
                    flags: ['master'],
                    pingSent: 0,
                    pongRecv: 0,
                    configEpoch: 0,
                    linkState: RedisClusterNodeLinkStates.CONNECTED,
                    slots: [], // TODO
                    replicas: []
                }]
            );
        });
    });
});
