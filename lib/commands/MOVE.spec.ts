import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MOVE';

describe('MOVE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['MOVE', 'key', '1']
        );
    });

    testUtils.testWithClient('client.move', async client => {
        assert.equal(
            await client.move('key', 1),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
