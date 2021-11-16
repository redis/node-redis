import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZREM';

describe('ZREM', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['ZREM', 'key', 'member']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['ZREM', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.zRem', async client => {
        assert.equal(
            await client.zRem('key', 'member'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
