import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './WAIT';

describe('WAIT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(0, 1),
            ['WAIT', '0', '1']
        );
    });

    testUtils.testWithClient('client.wait', async client => {
        assert.equal(
            await client.wait(0, 1),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
