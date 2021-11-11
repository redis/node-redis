import { strict as assert } from 'assert';
import { scriptSha1 } from '../lua-script';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SCRIPT_LOAD';

describe('SCRIPT LOAD', () => {
    const SCRIPT = 'return 1;',
        SCRIPT_SHA1 = scriptSha1(SCRIPT);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(SCRIPT),
            ['SCRIPT', 'LOAD', SCRIPT]
        );
    });

    testUtils.testWithClient('client.scriptLoad', async client => {
        assert.equal(
            await client.scriptLoad(SCRIPT),
            SCRIPT_SHA1
        );
    }, GLOBAL.SERVERS.OPEN);
});
