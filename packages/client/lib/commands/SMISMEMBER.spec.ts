import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SMISMEMBER';

describe('SMISMEMBER', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', ['1', '2']),
            ['SMISMEMBER', 'key', '1', '2']
        );
    });

    testUtils.testWithClient('client.smIsMember', async client => {
        assert.deepEqual(
            await client.smIsMember('key', ['1', '2']),
            [false, false]
        );
    }, GLOBAL.SERVERS.OPEN);
});
