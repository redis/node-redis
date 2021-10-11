import { strict as assert } from 'assert';
import { transformArguments } from './HSET';
import { TestRedisServers, itWithClient, TestRedisClusters, itWithCluster } from '../test-utils';

describe('HSET', () => {
    describe('transformArguments', () => {
        it('field, value', () => {
            assert.deepEqual(
                transformArguments('key', 'field', 'value'),
                ['HSET', 'key', 'field', 'value']
            );
        });

        it('Map', () => {
            assert.deepEqual(
                transformArguments('key', new Map([['field', 'value']])),
                ['HSET', 'key', 'field', 'value']
            );
        });

        it('Array', () => {
            assert.deepEqual(
                transformArguments('key', [['field', 'value']]),
                ['HSET', 'key', 'field', 'value']
            );
        });

        it('Object', () => {
            assert.deepEqual(
                transformArguments('key', { field: 'value' }),
                ['HSET', 'key', 'field', 'value']
            );
        });
    });

    itWithClient(TestRedisServers.OPEN, 'client.hSet', async client => {
        assert.equal(
            await client.hSet('key', 'field', 'value'),
            1
        );
    });

    itWithCluster(TestRedisClusters.OPEN, 'cluster.hSet', async cluster => {
        assert.equal(
            await cluster.hSet('key', { field: 'value' }),
            1
        );
    });
});