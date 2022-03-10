import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './FUNCTION_STATS';

describe('FUNCTION STATS', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['FUNCTION', 'STATS']
        );
    });

    testUtils.testWithClient('client.functionStats', async client => {
        const stats = await client.functionStats();
        assert.equal(stats.runningScript, null);
        assert.ok(Array.isArray(stats.engines));
        for (const { engine, librariesCount, functionsCount } of stats.engines) {
            assert.equal(typeof engine, 'string');
            assert.equal(typeof librariesCount, 'number');
            assert.equal(typeof functionsCount, 'number');
        }
    }, GLOBAL.SERVERS.OPEN);
});
