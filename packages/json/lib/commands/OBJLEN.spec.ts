import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './OBJLEN';

describe('OBJLEN', () => {
    describe('transformArguments', () => {
        it('without path', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['JSON.OBJLEN', 'key']
            );
        });

        it('with path', () => {
            assert.deepEqual(
                transformArguments('key', '$'),
                ['JSON.OBJLEN', 'key', '$']
            );
        });
    });

    // testUtils.testWithClient('client.json.objLen', async client => {
    //     assert.equal(
    //         await client.json.objLen('key', '$'),
    //         [null]
    //     );
    // }, GLOBAL.SERVERS.OPEN);
});
