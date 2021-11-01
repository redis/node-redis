import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DECR';

describe('DECR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['DECR', 'key']
        );
    });

    testUtils.testWithClient('client.decr', async client => {
        assert.equal(
            await client.decr('key'),
            -1
        );
    }, GLOBAL.SERVERS.OPEN);
});
