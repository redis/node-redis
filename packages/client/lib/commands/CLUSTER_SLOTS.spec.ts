import { strict as assert } from 'assert';
import { transformArguments, transformReply } from './CLUSTER_SLOTS';

describe('CLUSTER SLOTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['CLUSTER', 'SLOTS']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([
                [
                    0,
                    5460,
                    ['127.0.0.1', 30001, '09dbe9720cda62f7865eabc5fd8857c5d2678366'],
                    ['127.0.0.1', 30004, '821d8ca00d7ccf931ed3ffc7e3db0599d2271abf']
                ],
                [
                    5461,
                    10922,
                    ['127.0.0.1', 30002, 'c9d93d9f2c0c524ff34cc11838c2003d8c29e013'],
                    ['127.0.0.1', 30005, 'faadb3eb99009de4ab72ad6b6ed87634c7ee410f']
                ],
                [
                    10923,
                    16383,
                    ['127.0.0.1', 30003, '044ec91f325b7595e76dbcb18cc688b6a5b434a1'],
                    ['127.0.0.1', 30006, '58e6e48d41228013e5d9c1c37c5060693925e97e']
                ]
            ]),
            [{
                from: 0,
                to: 5460,
                master: {
                    ip: '127.0.0.1',
                    port: 30001,
                    id: '09dbe9720cda62f7865eabc5fd8857c5d2678366'
                },
                replicas: [{
                    ip: '127.0.0.1',
                    port: 30004,
                    id: '821d8ca00d7ccf931ed3ffc7e3db0599d2271abf'
                }]
            }, {
                from: 5461,
                to: 10922,
                master: {
                    ip: '127.0.0.1',
                    port: 30002,
                    id: 'c9d93d9f2c0c524ff34cc11838c2003d8c29e013'
                },
                replicas: [{
                    ip: '127.0.0.1',
                    port: 30005,
                    id: 'faadb3eb99009de4ab72ad6b6ed87634c7ee410f'
                }]
            }, {
                from: 10923,
                to: 16383,
                master: {
                    ip: '127.0.0.1',
                    port: 30003,
                    id: '044ec91f325b7595e76dbcb18cc688b6a5b434a1'
                },
                replicas: [{
                    ip: '127.0.0.1',
                    port: 30006,
                    id: '58e6e48d41228013e5d9c1c37c5060693925e97e'
                }]
            }]
        );
    });
});
