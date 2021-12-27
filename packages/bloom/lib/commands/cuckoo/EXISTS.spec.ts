import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './EXISTS';

describe('CF EXISTS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'item'),
            ['CF.EXISTS', 'key', 'item']
        );
    });

    testUtils.testWithClient('client.cf.exists', async client => {
        assert.equal(
            await client.cf.exists('key', 'item'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
