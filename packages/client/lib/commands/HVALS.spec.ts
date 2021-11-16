import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HVALS';

describe('HVALS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['HVALS', 'key']
        );
    });

    testUtils.testWithClient('client.hVals', async client => {
        assert.deepEqual(
            await client.hVals('key'),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
