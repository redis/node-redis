import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { FIRST_KEY_INDEX, transformArguments } from './XREADGROUP';

describe('XREADGROUP', () => {
    describe('FIRST_KEY_INDEX', () => {
        it('single stream', () => {
            assert.equal(
                FIRST_KEY_INDEX('', '', { key: 'key', id: '' }),
                'key'
            );
        });

        it('multiple streams', () => {
            assert.equal(
                FIRST_KEY_INDEX('', '', [{ key: '1', id: '' }, { key: '2', id: '' }]),
                '1'
            );
        });
    });

    describe('transformArguments', () => {
        it('single stream', () => {
            assert.deepEqual(
                transformArguments('group', 'consumer', {
                    key: 'key',
                    id: '0'
                }),
                ['XREADGROUP', 'GROUP', 'group', 'consumer', 'STREAMS', 'key', '0']
            );
        });

        it('multiple streams', () => {
            assert.deepEqual(
                transformArguments('group', 'consumer', [{
                    key: '1',
                    id: '0'
                }, {
                    key: '2',
                    id: '0'
                }]),
                ['XREADGROUP', 'GROUP', 'group', 'consumer', 'STREAMS', '1', '2', '0', '0']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('group', 'consumer', {
                    key: 'key',
                    id: '0'
                }, {
                    COUNT: 1
                }),
                ['XREADGROUP', 'GROUP', 'group', 'consumer', 'COUNT', '1', 'STREAMS', 'key', '0']
            );
        });

        it('with BLOCK', () => {
            assert.deepEqual(
                transformArguments('group', 'consumer', {
                    key: 'key',
                    id: '0'
                }, {
                    BLOCK: 0
                }),
                ['XREADGROUP', 'GROUP', 'group', 'consumer', 'BLOCK', '0', 'STREAMS', 'key', '0']
            );
        });

        it('with NOACK', () => {
            assert.deepEqual(
                transformArguments('group', 'consumer', {
                    key: 'key',
                    id: '0'
                }, {
                    NOACK: true
                }),
                ['XREADGROUP', 'GROUP', 'group', 'consumer', 'NOACK', 'STREAMS', 'key', '0']
            );
        });

        it('with COUNT, BLOCK, NOACK', () => {
            assert.deepEqual(
                transformArguments('group', 'consumer', {
                    key: 'key',
                    id: '0'
                }, {
                    COUNT: 1,
                    BLOCK: 0,
                    NOACK: true
                }),
                ['XREADGROUP', 'GROUP', 'group', 'consumer', 'COUNT', '1', 'BLOCK', '0', 'NOACK', 'STREAMS', 'key', '0']
            );
        });
    });

    describe('client.xReadGroup', () => {
        testUtils.testWithClient('null', async client => {
            const [, readGroupReply] = await Promise.all([
                client.xGroupCreate('key', 'group', '$', {
                    MKSTREAM: true
                }),
                client.xReadGroup('group', 'consumer', {
                    key: 'key',
                    id: '>'
                })
            ]);

            assert.equal(readGroupReply, null);
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with a message', async client => {
            const [, id, readGroupReply] = await Promise.all([
                client.xGroupCreate('key', 'group', '$', {
                    MKSTREAM: true
                }),
                client.xAdd('key', '*', { field: 'value' }),
                client.xReadGroup('group', 'consumer', {
                    key: 'key',
                    id: '>'
                })
            ]);

            assert.deepEqual(readGroupReply, [{
                name: 'key',
                messages: [{
                    id,
                    message: Object.create(null, {
                        field: {
                            value: 'value',
                            configurable: true,
                            enumerable: true
                        }
                    })
                }]
            }]);
        }, GLOBAL.SERVERS.OPEN);
    });

    testUtils.testWithCluster('cluster.xReadGroup', async cluster => {
        const [, readGroupReply] = await Promise.all([
            cluster.xGroupCreate('key', 'group', '$', {
                MKSTREAM: true
            }),
            cluster.xReadGroup('group', 'consumer', {
                key: 'key',
                id: '>'
            })
        ]);

        assert.equal(readGroupReply, null);
    }, GLOBAL.CLUSTERS.OPEN);
});
