import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './_LIST';

describe('_LIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['FT._LIST']
        );
    });

    testUtils.testWithClient('client.ft._list', async client => {
        assert.deepEqual(
            await client.ft._list(),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
