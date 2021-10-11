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
                    url: '127.0.0.1:30001@31001',
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
                        url: '127.0.0.1:30002@31002',
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

        it.skip('with importing slots', () => {
            assert.deepEqual(
                transformReply(
                    'id 127.0.0.1:30001@31001 master - 0 0 0 connected 0-<-16384\n'
                ),
                [{
                    id: 'id',
                    url: '127.0.0.1:30001@31001',
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
                    url: '127.0.0.1:30001@31001',
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
