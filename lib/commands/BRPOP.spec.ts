import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments, transformReply } from './BRPOP';
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

    describe('transformReply', () => {
        it('null', () => {
            assert.equal(
                transformReply(null),
                null
            );
        });

        it('member', () => {
            assert.deepEqual(
                transformReply(['key', 'element']),
                {
                    key: 'key',
                    element: 'element'
                }
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.brPop', async client => {
        const [ brPopReply ] = await Promise.all([
            client.brPop(
                commandOptions({ isolated: true }),
                'key',
                1
            ),
            client.lPush('key', 'element'),
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
        const [ brPopReply ] = await Promise.all([
            cluster.brPop(
                commandOptions({ isolated: true }),
                'key',
                1
            ),
            cluster.lPush('key', 'element'),
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
