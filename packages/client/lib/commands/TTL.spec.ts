import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './TTL';

describe('TTL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['TTL', 'key']
        );
    });

    testUtils.testWithClient('client.ttl', async client => {
        assert.equal(
            await client.ttl('key'),
            -2
        );
    }, GLOBAL.SERVERS.OPEN);
});
