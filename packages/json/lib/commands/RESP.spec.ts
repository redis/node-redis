import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RESP from './RESP';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('RESP', () => {
    describe('transformArguments', () => {
        it('without path', () => {
            assert.deepEqual(
                parseArgs(RESP, 'key'),
                ['JSON.RESP', 'key']
            );
        });

        it('with path', () => {
            assert.deepEqual(
                parseArgs(RESP, 'key', '$'),
                ['JSON.RESP', 'key', '$']
            );
        });
    });

    // testUtils.testWithClient('client.json.resp', async client => {
    //     assert.deepEqual(
    //     await client.json.resp('key', '$'),
    //         [null]
    //     );
    // }, GLOBAL.SERVERS.OPEN);
});
