import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HRANDFIELD';

describe('HRANDFIELD', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['HRANDFIELD', 'key']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['HRANDFIELD', 'key', '1']
            );
        });

        it('with count & values', () => {
            assert.deepEqual(
                transformArguments('key', 1, true),
                ['HRANDFIELD', 'key', '1', 'WITHVALUES']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.hRandField', async client => {
        assert.equal(
            await client.hRandField('key'),
            null
        );
    });
});
