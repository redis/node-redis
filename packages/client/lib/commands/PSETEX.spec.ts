import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PSETEX';

describe('PSETEX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 1, 'value'),
            ['PSETEX', 'key', '1', 'value']
        );
    });

    testUtils.testWithClient('client.pSetEx', async client => {
        const a = await client.pSetEx('key', 1, 'value');
        assert.equal(
            await client.pSetEx('key', 1, 'value'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.pSetEx', async cluster => {
        assert.equal(
            await cluster.pSetEx('key', 1, 'value'),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
