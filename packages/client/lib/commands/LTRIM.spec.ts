import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LTRIM';

describe('LTRIM', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 0, -1),
            ['LTRIM', 'key', '0', '-1']
        );
    });

    testUtils.testWithClient('client.lTrim', async client => {
        assert.equal(
            await client.lTrim('key', 0, -1),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.lTrim', async cluster => {
        assert.equal(
            await cluster.lTrim('key', 0, -1),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
