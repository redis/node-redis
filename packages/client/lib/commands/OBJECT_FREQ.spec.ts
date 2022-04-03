import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './OBJECT_FREQ';

describe('OBJECT FREQ', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['OBJECT', 'FREQ', 'key']
        );
    });

    testUtils.testWithClient('client.objectFreq', async client => {
        assert.equal(
            await client.objectFreq('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
