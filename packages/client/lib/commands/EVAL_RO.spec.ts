import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './EVAL_RO';

describe('EVAL_RO', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('return KEYS[1] + ARGV[1]', {
                keys: ['key'],
                arguments: ['argument']
            }),
            ['EVAL_RO', 'return KEYS[1] + ARGV[1]', '1', 'key', 'argument']
        );
    });

    testUtils.testWithClient('client.evalRo', async client => {
        assert.equal(
            await client.evalRo('return 1'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.evalRo', async cluster => {
        assert.equal(
            await cluster.evalRo('return 1'),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
