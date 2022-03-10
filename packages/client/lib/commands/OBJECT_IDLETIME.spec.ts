import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './OBJECT_IDLETIME';

describe('OBJECT IDLETIME', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['OBJECT', 'IDLETIME', 'key']
        );
    });

    testUtils.testWithClient('client.objectIdleTime', async client => {
        assert.equal(
            await client.objectIdleTime('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
