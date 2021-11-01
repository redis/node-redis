import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SCARD';

describe('SCARD', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['SCARD', 'key']
        );
    });

    testUtils.testWithClient('client.sCard', async client => {
        assert.equal(
            await client.sCard('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
