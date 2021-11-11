import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HKEYS';

describe('HKEYS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HKEYS', 'key']
        );
    });

    testUtils.testWithClient('client.hKeys', async client => {
        assert.deepEqual(
            await client.hKeys('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
