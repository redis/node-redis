import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_STATS';

describe('FUNCTION STATS', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['FUNCTION', 'STATS']
        );
    });

    testUtils.testWithClient('client.functionStats', async client => {
        const stats = await client.functionStats();
        assert.equal(stats.runningScript, null);
        assert.equal(typeof stats.engines, 'object');
        for (const [engine, { librariesCount, functionsCount }] of Object.entries(stats.engines)) {
            assert.equal(typeof engine, 'string');
            assert.equal(typeof librariesCount, 'number');
            assert.equal(typeof functionsCount, 'number');
        }
    }, GLOBAL.SERVERS.OPEN);
});
