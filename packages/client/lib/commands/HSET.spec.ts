import { strict as assert } from 'assert';
import { transformArguments } from './HSET';
import testUtils, { GLOBAL } from '../test-utils';

describe.only('HSET', () => {
    describe('transformArguments', () => {
        describe('field, value', () => {
            it('string', () => {
                assert.deepEqual(
                    transformArguments('key', 'field', 'value'),
                    ['HSET', 'key', 'field', 'value']
                );
            });

            it('Buffer', () => {
                assert.deepEqual(
                    transformArguments('key', Buffer.from('field'), Buffer.from('value')),
                    ['HSET', 'key', Buffer.from('field'), Buffer.from('value')]
                );
            });
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

    testUtils.testWithClient('client.hSet', async client => {
        assert.equal(
            await client.hSet('key', 'field', 'value'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.hSet', async cluster => {
        assert.equal(
            await cluster.hSet('key', { field: 'value' }),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});