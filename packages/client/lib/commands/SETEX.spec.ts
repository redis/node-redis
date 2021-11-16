import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SETEX';

describe('SETEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1, 'value'),
            ['SETEX', 'key', '1', 'value']
        );
    });

    testUtils.testWithClient('client.setEx', async client => {
        assert.equal(
            await client.setEx('key', 1, 'value'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.setEx', async cluster => {
        assert.equal(
            await cluster.setEx('key', 1, 'value'),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
