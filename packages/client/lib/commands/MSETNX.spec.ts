import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MSETNX';

describe('MSETNX', () => {
    describe('transformArguments', () => {
        it("['key1', 'value1', 'key2', 'value2']", () => {
            assert.deepEqual(
                transformArguments(['key1', 'value1', 'key2', 'value2']),
                ['MSETNX', 'key1', 'value1', 'key2', 'value2']
            );
        });

        it("[['key1', 'value1'], ['key2', 'value2']]", () => {
            assert.deepEqual(
                transformArguments([['key1', 'value1'], ['key2', 'value2']]),
                ['MSETNX', 'key1', 'value1', 'key2', 'value2']
            );
        });

        it("{key1: 'value1'. key2: 'value2'}", () => {
            assert.deepEqual(
                transformArguments({ key1: 'value1', key2: 'value2' }),
                ['MSETNX', 'key1', 'value1', 'key2', 'value2']
            );
        });
    });

    testUtils.testWithClient('client.mSetNX', async client => {
        assert.equal(
            await client.mSetNX(['key1', 'value1', 'key2', 'value2']),
            true
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.mSetNX', async cluster => {
        assert.equal(
            await cluster.mSetNX(['{key}1', 'value1', '{key}2', 'value2']),
            true
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
