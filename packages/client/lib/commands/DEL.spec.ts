import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DEL';

describe('DEL', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['DEL', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['key1', 'key2']),
                ['DEL', 'key1', 'key2']
            );
        });
    });

    testUtils.testWithClient('client.del', async client => {
        assert.equal(
            await client.del('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
