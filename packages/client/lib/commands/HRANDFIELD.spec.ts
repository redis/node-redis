import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HRANDFIELD';

describe('HRANDFIELD', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HRANDFIELD', 'key']
        );
    });

    testUtils.testWithClient('client.hRandField', async client => {
        assert.equal(
            await client.hRandField('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
