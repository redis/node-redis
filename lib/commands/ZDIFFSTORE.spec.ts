import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './ZDIFFSTORE';

describe('ZDIFFSTORE', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['ZDIFFSTORE', 'destination', '1', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['ZDIFFSTORE', 'destination', '2', '1', '2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.zDiffStore', async client => {
        assert.equal(
            await client.zDiffStore('destination', 'key'),
            0
        );
    });
});
