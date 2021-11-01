import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PTTL';

describe('PTTL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['PTTL', 'key']
        );
    });

    testUtils.testWithClient('client.pTTL', async client => {
        assert.equal(
            await client.pTTL('key'),
            -2
        );
    }, GLOBAL.SERVERS.OPEN);
});
