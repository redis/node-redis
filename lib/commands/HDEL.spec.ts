import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HDEL';

describe('HDEL', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'field'),
                ['HDEL', 'key', 'field']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['1', '2']),
                ['HDEL', 'key', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.hDel', async client => {
        assert.equal(
            await client.hDel('key', 'field'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
