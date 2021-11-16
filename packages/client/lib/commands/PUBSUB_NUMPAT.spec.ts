import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PUBSUB_NUMPAT';

describe('PUBSUB NUMPAT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['PUBSUB', 'NUMPAT']
        );
    });

    testUtils.testWithClient('client.pubSubNumPat', async client => {
        assert.equal(
            await client.pubSubNumPat(),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
