import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SADD';

describe('SADD', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'member'),
                ['SADD', 'key', 'member']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['SADD', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.sAdd', async client => {
        assert.equal(
            await client.sAdd('key', 'member'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);
});
