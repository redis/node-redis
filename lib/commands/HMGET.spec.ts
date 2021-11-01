import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HMGET';

describe('HMGET', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key', 'field'),
                ['HMGET', 'key', 'field']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('key', ['field1', 'field2']),
                ['HMGET', 'key', 'field1', 'field2']
            );
        });
    });

    testUtils.testWithClient('client.hmGet', async client => {
        assert.deepEqual(
            await client.hmGet('key', 'field'),
            [null]
        );
    }, GLOBAL.SERVERS.OPEN);
});
