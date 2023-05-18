import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MERGE';

describe('MERGE', () => {
    testUtils.isVersionGreaterThanHook([2, 6]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '$', 1),
            ['JSON.MERGE', 'key', '$', '1']
        );
    });

    testUtils.testWithClient('client.json.merge', async client => {
        assert.equal(
            await client.json.merge('key', '$', 'json'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
