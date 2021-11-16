import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SREM';

describe('SREM', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['SREM', 'key', 'member']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['SREM', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.sRem', async client => {
        assert.equal(
            await client.sRem('key', 'member'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
