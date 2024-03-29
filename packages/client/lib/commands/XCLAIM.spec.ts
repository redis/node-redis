import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XCLAIM';

describe('XCLAIM', () => {
    describe('transformArguments', () => {
        it('single id (string)', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0'),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0']
            );
        });

        it('multiple ids (array)', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, ['0-0', '1-0']),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', '1-0']
            );
        });

        it('with IDLE', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    IDLE: 1
                }),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'IDLE', '1']
            );
        });

        it('with TIME (number)', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    TIME: 1
                }),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'TIME', '1']
            );
        });

        it('with TIME (date)', () => {
            const d = new Date();
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    TIME: d
                }),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'TIME', d.getTime().toString()]
            );
        });

        it('with RETRYCOUNT', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    RETRYCOUNT: 1
                }),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'RETRYCOUNT', '1']
            );
        });

        it('with FORCE', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    FORCE: true
                }),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'FORCE']
            );
        });

        it('with IDLE, TIME, RETRYCOUNT, FORCE, JUSTID', () => {
            assert.deepEqual(
                transformArguments('key', 'group', 'consumer', 1, '0-0', {
                    IDLE: 1,
                    TIME: 1,
                    RETRYCOUNT: 1,
                    FORCE: true
                }),
                ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'IDLE', '1', 'TIME', '1', 'RETRYCOUNT', '1', 'FORCE']
            );
        });
    });

    testUtils.testWithClient('client.xClaim', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.deepEqual(
            await client.xClaim('key', 'group', 'consumer', 0, '0-0'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('client.xClaim with a message', async client => {
        await client.xGroupCreate('key', 'group', '$', { MKSTREAM: true });
        const id = await client.xAdd('key', '*', { foo: 'bar' });
        await client.xReadGroup('group', 'consumer', { key: 'key', id: '>' });

        assert.deepEqual(
            await client.xClaim('key', 'group', 'consumer', 0, id),
            [{
                id,
                message: Object.create(null, { 'foo': {
                    value: 'bar',
                    configurable: true,
                    enumerable: true
                } })
            }]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('client.xClaim with a trimmed message', async client => {
        await client.xGroupCreate('key', 'group', '$', { MKSTREAM: true });
        const id = await client.xAdd('key', '*', { foo: 'bar' });
        await client.xReadGroup('group', 'consumer', { key: 'key', id: '>' });
        await client.xTrim('key', 'MAXLEN', 0);

        assert.deepEqual(
            await client.xClaim('key', 'group', 'consumer', 0, id),
            testUtils.isVersionGreaterThan([7, 0]) ? []: [null]
        );
    }, GLOBAL.SERVERS.OPEN);
});
