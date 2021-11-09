import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZSCORE';

describe('ZSCORE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'member'),
            ['ZSCORE', 'key', 'member']
        );
    });

    testUtils.testWithClient('client.zScore', async client => {
        assert.equal(
            await client.zScore('key', 'member'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
