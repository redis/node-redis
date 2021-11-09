import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './TYPE';

describe('TYPE', () => {
    describe('transformArguments', () => {
        it('without path', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['JSON.TYPE', 'key']
            );
        });

        it('with path', () => {
            assert.deepEqual(
                transformArguments('key', '$'),
                ['JSON.TYPE', 'key', '$']
            );
        });
    });

    // testUtils.testWithClient('client.json.type', async client => {
    //     assert.deepEqual(
    //         await client.json.type('key', '$'),
    //         [null]
    //     );
    // }, GLOBAL.SERVERS.OPEN);
});
