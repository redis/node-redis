import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, itWithCluster, TestRedisClusters } from '../test-utils';
import { transformArguments } from './LOLWUT';

describe('LOLWUT', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['LOLWUT']
            );
        });

        it('with version', () => {
            assert.deepEqual(
                transformArguments(5),
                ['LOLWUT', 'VERSION', '5']
            );
        });

        it('with version and optional arguments', () => {
            assert.deepEqual(
                transformArguments(5, 1, 2, 3),
                ['LOLWUT', 'VERSION', '5', '1', '2', '3']
            );
        });
    });
    

    itWithClient(TestRedisServers.OPEN, 'client.LOLWUT', async client => {
        assert.equal(
            typeof (await client.LOLWUT()),
            'string'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.LOLWUT', async cluster => {
        assert.equal(
            typeof (await cluster.LOLWUT()),
            'string'
        );
    });
});
