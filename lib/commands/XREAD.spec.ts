import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './XREAD';

describe('XREAD', () => {
    describe('transformArguments', () => {
        it('single stream', () => {
            assert.deepEqual(
                transformArguments({
                    key: 'key',
                    id: '0'
                }),
                ['XREAD', 'STREAMS', 'key', '0']
            );
        });
    
        it('multiple streams', () => {
            assert.deepEqual(
                transformArguments([{
                    key: '1',
                    id: '0'
                }, {                    
                    key: '2',
                    id: '0'
                }]),
                ['XREAD', 'STREAMS', '1', '2', '0', '0']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments({
                    key: 'key',
                    id: '0'
                }, {
                    COUNT: 1
                }),
                ['XREAD', 'COUNT', '1', 'STREAMS', 'key', '0']
            );
        });

        it('with BLOCK', () => {
            assert.deepEqual(
                transformArguments({
                    key: 'key',
                    id: '0'
                }, {
                    BLOCK: 0
                }),
                ['XREAD', 'BLOCK', '0', 'STREAMS', 'key', '0']
            );
        });

        it('with COUNT, BLOCK', () => {
            assert.deepEqual(
                transformArguments({
                    key: 'key',
                    id: '0'
                }, {
                    COUNT: 1,
                    BLOCK: 0
                }),
                ['XREAD', 'COUNT', '1', 'BLOCK', '0', 'STREAMS', 'key', '0']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.xRead', async client => {
        assert.equal(
            await client.xRead({
                key: 'key',
                id: '0'
            }),
            null
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.xRead', async cluster => {
        assert.equal(
            await cluster.xRead({
                key: 'key',
                id: '0'
            }),
            null
        );
    });
});
