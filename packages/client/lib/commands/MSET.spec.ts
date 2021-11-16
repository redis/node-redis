import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
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

    testUtils.testWithClient('client.mSet', async client => {
        assert.equal(
            await client.mSet(['key1', 'value1', 'key2', 'value2']),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.mSet', async cluster => {
        assert.equal(
            await cluster.mSet(['{key}1', 'value1', '{key}2', 'value2']),
            'OK'
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
