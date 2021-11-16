import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SWAPDB';

describe('SWAPDB', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0, 1),
            ['SWAPDB', '0', '1']
        );
    });

    testUtils.testWithClient('client.swapDb', async client => {
        assert.equal(
            await client.swapDb(0, 1),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
