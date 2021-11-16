import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { FIRST_KEY_INDEX, transformArguments } from './XREAD';

describe('XREAD', () => {
    describe('FIRST_KEY_INDEX', () => {
        it('single stream', () => {
            assert.equal(
                FIRST_KEY_INDEX({ key: 'key', id: '' }),
                'key'
            );
        });

        it('multiple streams', () => {
            assert.equal(
                FIRST_KEY_INDEX([{ key: '1', id: '' }, { key: '2', id: '' }]),
                '1'
            );
        });
    });

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

    testUtils.testWithClient('client.xRead', async client => {
        assert.equal(
            await client.xRead({
                key: 'key',
                id: '0'
            }),
            null
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.xRead', async cluster => {
        assert.equal(
            await cluster.xRead({
                key: 'key',
                id: '0'
            }),
            null
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
