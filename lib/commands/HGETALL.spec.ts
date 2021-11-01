import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformReply } from './HGETALL';

describe('HGETALL', () => {
    describe('transformReply', () => {
        it('empty', () => {
            assert.deepEqual(
                transformReply([]),
                Object.create(null)
            );
        });

        it('with values', () => {
            assert.deepEqual(
                transformReply(['key1', 'value1', 'key2', 'value2']),
                Object.create(null, {
                    key1: {
                        value: 'value1',
                        configurable: true,
                        enumerable: true,
                        writable: true
                    },
                    key2: {
                        value: 'value2',
                        configurable: true,
                        enumerable: true,
                        writable: true
                    }
                })
            );
        });
    });

    testUtils.testWithClient('client.hGetAll', async client => {
        assert.deepEqual(
            await client.hGetAll('key'),
            Object.create(null)
        );
    }, GLOBAL.SERVERS.OPEN);
});
