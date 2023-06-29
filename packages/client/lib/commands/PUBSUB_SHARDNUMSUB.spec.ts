import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PUBSUB_SHARDNUMSUB';

describe('PUBSUB SHARDNUMSUB', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['PUBSUB', 'SHARDNUMSUB']
            );
        });

        it('string', () => {
            assert.deepEqual(
                transformArguments('channel'),
                ['PUBSUB', 'SHARDNUMSUB', 'channel']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['PUBSUB', 'SHARDNUMSUB', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.pubSubShardNumSub', async client => {
        assert.deepEqual(
            await client.pubSubShardNumSub(),
            Object.create(null)
        );

        assert.deepEqual(
            await client.pubSubShardNumSub('channel'),
            { 'channel': 0 }
        );

        assert.deepEqual(
            await client.pubSubShardNumSub(['foo', 'bar']),
            { 'foo': 0, 'bar': 0 }
        );
    }, GLOBAL.SERVERS.OPEN);
});
