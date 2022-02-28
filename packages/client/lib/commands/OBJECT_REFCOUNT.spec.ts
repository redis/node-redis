import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './OBJECT_REFCOUNT';

describe('OBJECT REFCOUNT', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['OBJECT', 'REFCOUNT', 'key']
        );
    });

    testUtils.testWithClient('client.objectRefCount', async client => {
        client.lPush('key', 'hello world');
        assert.equal(
            await client.objectRefCount('key'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);
});
