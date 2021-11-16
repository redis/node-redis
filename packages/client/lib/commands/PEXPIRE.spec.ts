import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PEXPIRE';

describe('PEXPIRE', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1),
            ['PEXPIRE', 'key', '1']
        );
    });

    testUtils.testWithClient('client.pExpire', async client => {
        assert.equal(
            await client.pExpire('key', 1),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
