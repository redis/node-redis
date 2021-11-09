import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './ROLE';

describe('ROLE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['ROLE']
        );
    });

    describe('transformReply', () => {
        it('master', () => {
            assert.deepEqual(
                transformReply(['master', 3129659, [['127.0.0.1', '9001', '3129242'], ['127.0.0.1', '9002', '3129543']]]),
                {
                    role: 'master',
                    replicationOffest: 3129659,
                    replicas: [{
                        ip: '127.0.0.1',
                        port: 9001,
                        replicationOffest: 3129242
                    }, {
                        ip: '127.0.0.1',
                        port: 9002,
                        replicationOffest: 3129543
                    }]
                }
            );
        });

        it('replica', () => {
            assert.deepEqual(
                transformReply(['slave', '127.0.0.1', 9000, 'connected', 3167038]),
                {
                    role: 'slave',
                    master: {
                        ip: '127.0.0.1',
                        port: 9000
                    },
                    state: 'connected',
                    dataReceived: 3167038
                }
            );
        });

        it('sentinel', () => {
            assert.deepEqual(
                transformReply(['sentinel', ['resque-master', 'html-fragments-master', 'stats-master', 'metadata-master']]),
                {
                    role: 'sentinel',
                    masterNames: ['resque-master', 'html-fragments-master', 'stats-master', 'metadata-master']
                }
            );
        });
    });

    testUtils.testWithClient('client.role', async client => {
        assert.deepEqual(
            await client.role(),
            {
                role: 'master',
                replicationOffest: 0,
                replicas: []
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
