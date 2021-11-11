import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUGLEN';

describe('SUGLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['FT.SUGLEN', 'key']
        );
    });

    testUtils.testWithClient('client.ft.sugLen', async client => {
        assert.equal(
            await client.ft.sugLen('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
