import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './EVAL';

describe('EVAL', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('return KEYS[1] + ARGV[1]', {
                keys: ['key'],
                arguments: ['argument']
            }),
            ['EVAL', 'return KEYS[1] + ARGV[1]', '1', 'key', 'argument']
        );
    });

    testUtils.testWithClient('client.eval', async client => {
        assert.equal(
            await client.eval('return 1'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.eval', async cluster => {
        assert.equal(
            await cluster.eval('return 1'),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
