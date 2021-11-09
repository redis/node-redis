import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZMSCORE';

describe('ZMSCORE', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['ZMSCORE', 'key', 'member']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['ZMSCORE', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.zmScore', async client => {
        assert.deepEqual(
            await client.zmScore('key', 'member'),
            [null]
        );
    }, GLOBAL.SERVERS.OPEN);
});
