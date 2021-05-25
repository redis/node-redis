import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './HVALS';

describe('HVALS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HVALS', 'key']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.hVals', async client => {
        assert.deepEqual(
            await client.hVals('key'),
            []
        );
    });
});
