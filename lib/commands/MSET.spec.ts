import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';
import { transformArguments } from './MSET';

describe('MSET', () => {
    describe('transformArguments', () => {
        it("['key1', 'value1', 'key2', 'value2']", () => {
            assert.deepEqual(
                transformArguments(['key1', 'value1', 'key2', 'value2']),
                ['MSET', 'key1', 'value1', 'key2', 'value2']
            );
        });

        it("[['key1', 'value1'], ['key2', 'value2']]", () => {
            assert.deepEqual(
                transformArguments([['key1', 'value1'], ['key2', 'value2']]),
                ['MSET', 'key1', 'value1', 'key2', 'value2']
            );
        });

        it("{key1: 'value1'. key2: 'value2'}", () => {
            assert.deepEqual(
                transformArguments({ key1: 'value1', key2: 'value2' }),
                ['MSET', 'key1', 'value1', 'key2', 'value2']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.mSet', async client => {
        assert.equal(
            await client.mSet(['key1', 'value1', 'key2', 'value2']),
            'OK'
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.mSet', async cluster => {
        assert.equal(
            await cluster.mSet(['{key}1', 'value1', '{key}2', 'value2']),
            'OK'
        );
    });
});
