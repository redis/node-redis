import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './PUBSUB_NUMPAT';

describe('PUBSUB NUMPAT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['PUBSUB', 'NUMPAT']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.pubSubNumPat', async client => {
        assert.equal(
            await client.pubSubNumPat(),
            0
        );
    });
});
