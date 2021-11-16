import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HSTRLEN';

describe('HSTRLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field'),
            ['HSTRLEN', 'key', 'field']
        );
    });

    testUtils.testWithClient('client.hStrLen', async client => {
        assert.equal(
            await client.hStrLen('key', 'field'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
