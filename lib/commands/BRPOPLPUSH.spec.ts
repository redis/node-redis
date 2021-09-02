import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './BRPOPLPUSH';
import { commandOptions } from '../../index';

describe('BRPOPLPUSH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination', 0),
            ['BRPOPLPUSH', 'source', 'destination', '0']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.brPopLPush', async client => {
        const [ popReply ] = await Promise.all([
            client.brPopLPush(
                commandOptions({ isolated: true }),
                'source',
                'destination',
                0
            ),
            client.lPush('source', 'element')
        ]);

        assert.equal(
            popReply,
            'element'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.brPopLPush', async cluster => {
        const [ popReply ] = await Promise.all([
            cluster.brPopLPush(
                commandOptions({ isolated: true }),
                '{tag}source',
                '{tag}destination',
                0
            ),
            cluster.lPush('{tag}source', 'element')
        ]);

        assert.equal(
            popReply,
            'element'
        );
    });
});
