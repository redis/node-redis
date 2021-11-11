import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ZPOPMIN_COUNT';

describe('ZPOPMIN COUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['ZPOPMIN', 'key', '1']
        );
    });

    testUtils.testWithClient('client.zPopMinCount', async client => {
        assert.deepEqual(
            await client.zPopMinCount('key', 1),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
