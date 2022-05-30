import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './CREATE';

describe('TDIGEST.CREATE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 100),
            ['TDIGEST.CREATE', 'key', '100']
        );
    });

    testUtils.testWithClient('client.tDigest.create', async client => {
        assert.equal(
            await client.tDigest.create('key', 100),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
