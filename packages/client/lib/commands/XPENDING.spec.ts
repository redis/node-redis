import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XPENDING';

describe('XPENDING', () => {
    describe('transformArguments', () => {
        it('transformArguments', () => {
            assert.deepEqual(
                transformArguments('key', 'group'),
                ['XPENDING', 'key', 'group']
            );
        });
    });

    describe('client.xPending', () => {
        testUtils.testWithClient('simple', async client => {
            await client.xGroupCreate('key', 'group', '$', {
                MKSTREAM: true
            });

            assert.deepEqual(
                await client.xPending('key', 'group'),
                {
                    pending: 0,
                    firstId: null,
                    lastId: null,
                    consumers: null
                }
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with consumers', async client => {
            const [,, id] = await Promise.all([
                client.xGroupCreate('key', 'group', '$', {
                    MKSTREAM: true
                }),
                client.xGroupCreateConsumer('key', 'group', 'consumer'),
                client.xAdd('key', '*', { field: 'value' }),
                client.xReadGroup('group', 'consumer', {
                    key: 'key',
                    id: '>'
                })
            ]);

            assert.deepEqual(
                await client.xPending('key', 'group'),
                {
                    pending: 1,
                    firstId: id,
                    lastId: id,
                    consumers: [{
                        name: 'consumer',
                        deliveriesCounter: 1
                    }]
                }
            );
        }, {
            ...GLOBAL.SERVERS.OPEN,
            minimumDockerVersion: [6, 2]
        });
    });
});
