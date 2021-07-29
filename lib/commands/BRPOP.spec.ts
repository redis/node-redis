import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './BRPOP';
import { commandOptions } from '../../index';

describe('BRPOP', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['BRPOP', 'key', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments(['key1', 'key2'], 0),
                ['BRPOP', 'key1', 'key2', '0']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.brPop', async client => {
        const [brPopReply] = await Promise.all([
            client.brPop(commandOptions({
                duplicateConnection: true
            }), 'key', 0),
            client.lPush('key', 'element')
        ]);

        assert.deepEqual(
            brPopReply,
            {
                key: 'key',
                element: 'element'
            }
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.brPop', async cluster => {
        const [brPopReply] = await Promise.all([
            cluster.brPop(commandOptions({
                duplicateConnection: true
            }), 'key', 0),
            cluster.lPush('key', 'element')
        ]);

        assert.deepEqual(
            brPopReply,
            {
                key: 'key',
                element: 'element'
            }
        );
    });
});
