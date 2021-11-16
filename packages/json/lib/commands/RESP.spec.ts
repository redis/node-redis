import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RESP';

describe('RESP', () => {
    describe('transformArguments', () => {
        it('without path', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['JSON.RESP', 'key']
            );
        });

        it('with path', () => {
            assert.deepEqual(
                transformArguments('key', '$'),
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
