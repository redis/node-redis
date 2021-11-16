import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZPOPMAX_COUNT';

describe('ZPOPMAX COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZPOPMAX', 'key', '1']
        );
    });

    testUtils.testWithClient('client.zPopMaxCount', async client => {
        assert.deepEqual(
            await client.zPopMaxCount('key', 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
