import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './RESET';

describe('TDIGEST RESET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('tDigest'),
            ['TDIGEST.RESET', 'tDigest']
        );
    });

    testUtils.testWithClient('client.bf.reserve', async client => {
        await client.bf.create('tDigest', 100)
        assert.equal(
            await client.bf.reset('tDigest'), 'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
