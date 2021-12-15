import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './MERGE';

describe('TDIGEST MERGE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('to-tDigest', 'from-tDigest'),
            ['TDIGEST.MERGE', 'to-tDigest', 'from-tDigest']
        );
    });

    testUtils.testWithClient('client.tdigest.merge', async client => {
        await Promise.all([
            client.bf.create('to-tDigest', 10),
            client.bf.create('from-tDigest', 10)
        ]) 
        assert.equal(
            await client.bf.merge('to-tDigest', 'from-tDigest'), 'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
