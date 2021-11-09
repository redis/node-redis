import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './INCR';

describe('INCR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['INCR', 'key']
        );
    });

    testUtils.testWithClient('client.incr', async client => {
        assert.equal(
            await client.incr('key'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);
});
