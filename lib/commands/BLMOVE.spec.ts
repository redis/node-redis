import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters, describeHandleMinimumRedisVersion } from '../test-utils';
import { transformArguments } from './BLMOVE';
import { commandOptions } from '../../index';

describe('BLMOVE', () => {
    describeHandleMinimumRedisVersion([6, 2]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('source', 'destination', 'LEFT', 'RIGHT', 0),
            ['BLMOVE', 'source', 'destination', 'LEFT', 'RIGHT', '0']
        );
    });

    itWithClient(TestRedisServers.OPEN, 'client.blMove', async client => {
        const [blMoveReply] = await Promise.all([
            client.blMove(commandOptions({
                isolated: true
            }), 'source', 'destination', 'LEFT', 'RIGHT', 0),
            client.lPush('source', 'element')
        ]);

        assert.equal(
            blMoveReply,
            'element'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.blMove', async cluster => {
        const [blMoveReply] = await Promise.all([
            cluster.blMove(commandOptions({
                isolated: true
            }), '{tag}source', '{tag}destination', 'LEFT', 'RIGHT', 0),
            cluster.lPush('{tag}source', 'element')
        ]);

        assert.equal(
            blMoveReply,
            'element'
        );
    });
});
