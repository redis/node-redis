import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZCARD';

describe('ZCARD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['ZCARD', 'key']
        );
    });

    testUtils.testWithClient('client.zCard', async client => {
        assert.equal(
            await client.zCard('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
