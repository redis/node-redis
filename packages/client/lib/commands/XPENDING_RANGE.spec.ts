import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XPENDING_RANGE';

describe('XPENDING RANGE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 'group', '-', '+', 1),
                ['XPENDING', 'key', 'group', '-', '+', '1']
            );
        });

        it('with IDLE', () => {
            assert.deepEqual(
                transformArguments('key', 'group', '-', '+', 1, {
                    IDLE: 1,
                }),
                ['XPENDING', 'key', 'group', 'IDLE', '1', '-', '+', '1']
            );
        });

        it('with consumer', () => {
            assert.deepEqual(
                transformArguments('key', 'group', '-', '+', 1, {
                    consumer: 'consumer'
                }),
                ['XPENDING', 'key', 'group', '-', '+', '1', 'consumer']
            );
        });

        it('with IDLE, consumer', () => {
            assert.deepEqual(
                transformArguments('key', 'group', '-', '+', 1, {
                    IDLE: 1,
                    consumer: 'consumer'
                }),
                ['XPENDING', 'key', 'group', 'IDLE', '1', '-', '+', '1', 'consumer']
            );
        });
    });

    testUtils.testWithClient('client.xPendingRange', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.deepEqual(
            await client.xPendingRange('key', 'group', '-', '+', 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
