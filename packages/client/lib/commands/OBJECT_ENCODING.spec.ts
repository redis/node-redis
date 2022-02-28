import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './OBJECT_ENCODING';

describe('OBJECT ENCODING', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['OBJECT', 'ENCODING', 'key']
        );
    });

    testUtils.testWithClient('client.objectEncoding', async client => {
        client.lPush('key', 'hello world');
        assert.equal(
            await client.objectEncoding('key'),
            'quicklist'
        );
    }, GLOBAL.SERVERS.OPEN);
});
