import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './XLEN';

describe('XLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['XLEN', 'key']
        );
    });

    testUtils.testWithClient('client.xLen', async client => {
        assert.equal(
            await client.xLen('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
