import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './BLPOP';
import { commandOptions } from '../../index';

describe('BLPOP', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['BLPOP', 'key', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments(['key1', 'key2'], 0),
                ['BLPOP', 'key1', 'key2', '0']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.blPop', async client => {
        const [popReply] = await Promise.all([
            client.blPop(commandOptions({
                isolated: true
            }), 'key', 0),
            client.lPush('key', 'element')
        ]);

        assert.deepEqual(
            popReply,
            {
                key: 'key',
                element: 'element'
            }
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.blPop', async cluster => {
        const [popReply] = await Promise.all([
            cluster.blPop(commandOptions({
                isolated: true
            }), 'key', 0),
            cluster.lPush('key', 'element')
        ]);

        assert.deepEqual(
            popReply,
            {
                key: 'key',
                element: 'element'
            }
        );
    });
});
