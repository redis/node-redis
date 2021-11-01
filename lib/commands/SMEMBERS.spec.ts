import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SMEMBERS';

describe('SMEMBERS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['SMEMBERS', 'key']
        );
    });

    testUtils.testWithClient('client.sMembers', async client => {
        assert.deepEqual(
            await client.sMembers('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
