import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './BLPOP';
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

    testUtils.testWithClient('client.blPop', async client => {
        const [ blPopReply ] = await Promise.all([
            client.blPop(
                commandOptions({ isolated: true }),
                'key',
                1
            ),
            client.lPush('key', 'element'),
        ]);

        assert.deepEqual(
            blPopReply,
            {
                key: 'key',
                element: 'element'
            }
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.blPop', async cluster => {
        const [ blPopReply ] = await Promise.all([
            cluster.blPop(
                commandOptions({ isolated: true }),
                'key',
                1
            ),
            cluster.lPush('key', 'element')
        ]);

        assert.deepEqual(
            blPopReply,
            {
                key: 'key',
                element: 'element'
            }
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
