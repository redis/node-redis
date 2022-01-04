import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './EXISTS';

describe('BF EXISTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['BF.EXISTS', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.bf.exists', async client => {
        assert.equal(
            await client.bf.exists('key', 'item'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
