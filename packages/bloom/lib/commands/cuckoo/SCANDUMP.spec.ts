import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './SCANDUMP';

describe('CF SCANDUMP', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0),
            ['CF.SCANDUMP', 'key', '0']
        );
    });

    testUtils.testWithClient('client.cf.scanDump', async client => {
        await client.cf.reserve('key', 4);
        assert.deepEqual(
            await client.cf.scanDump('key', 0),
            {
                iterator: 0,
                chunk: null
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
