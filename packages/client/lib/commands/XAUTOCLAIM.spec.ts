import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XAUTOCLAIM';

describe('XAUTOCLAIM', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0'),
                ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    COUNT: 1
                }),
                ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'COUNT', '1']
            );
        });
    });

    testUtils.testWithClient('client.xAutoClaim without messages', async client => {
        const [,, reply] = await Promise.all([
            client.xGroupCreate('key', 'group', '$', { MKSTREAM: true }),
            client.xGroupCreateConsumer('key', 'group', 'consumer'),
            client.xAutoClaim('key', 'group', 'consumer', 1, '0-0')
        ]);

        assert.deepEqual(reply, {
            nextId: '0-0',
            messages: []
        });
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('client.xAutoClaim with messages', async client => {
        const [,, id,, reply] = await Promise.all([
            client.xGroupCreate('key', 'group', '$', { MKSTREAM: true }),
            client.xGroupCreateConsumer('key', 'group', 'consumer'),
            client.xAdd('key', '*', { foo: 'bar' }),
            client.xReadGroup('group', 'consumer', { key: 'key', id: '>' }),
            client.xAutoClaim('key', 'group', 'consumer', 0, '0-0')
        ]);

        assert.deepEqual(reply, {
            nextId: '0-0',
            messages: [{
                id,
                message: Object.create(null, {
                    foo: {
                        value: 'bar',
                        configurable: true,
                        enumerable: true
                    }
                })
            }]
        });
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('client.xAutoClaim with trimmed messages', async client => {
        const [,,,,, id,, reply] = await Promise.all([
            client.xGroupCreate('key', 'group', '$', { MKSTREAM: true }),
            client.xGroupCreateConsumer('key', 'group', 'consumer'),
            client.xAdd('key', '*', { foo: 'bar' }),
            client.xReadGroup('group', 'consumer', { key: 'key', id: '>' }),
            client.xTrim('key', 'MAXLEN', 0),
            client.xAdd('key', '*', { bar: 'baz' }),
            client.xReadGroup('group', 'consumer', { key: 'key', id: '>' }),
            client.xAutoClaim('key', 'group', 'consumer', 0, '0-0')
        ]);

        assert.deepEqual(reply, {
            nextId: '0-0',
            messages: testUtils.isVersionGreaterThan([7, 0]) ? [{
                id,
                message: Object.create(null, {
                    bar: {
                        value: 'baz',
                        configurable: true,
                        enumerable: true
                    }
                })
            }] : [null, {
                id,
                message: Object.create(null, {
                    bar: {
                        value: 'baz',
                        configurable: true,
                        enumerable: true
                    }
                })
            }]
        });
    }, GLOBAL.SERVERS.OPEN);
});
