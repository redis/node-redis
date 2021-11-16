import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './STRLEN';

describe('STRLEN', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['STRLEN', 'key']
        );
    });

    testUtils.testWithClient('client.strLen', async client => {
        assert.equal(
            await client.strLen('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.strLen', async cluster => {
        assert.equal(
            await cluster.strLen('key'),
            0
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
