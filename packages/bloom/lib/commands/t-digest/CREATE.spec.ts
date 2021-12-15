import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './CREATE';

describe('TDIGEST CREATE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('tDigest', 100),
            ['TDIGEST.CREATE', 'tDigest', '100']
        );
    });

    testUtils.testWithClient('client.bf.reserve', async client => {
        assert.equal(
            await client.bf.create('tDigest', 100), 'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
