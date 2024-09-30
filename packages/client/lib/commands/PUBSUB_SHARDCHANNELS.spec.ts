import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PUBSUB_SHARDCHANNELS';

describe('PUBSUB SHARDCHANNELS', () => {
    testUtils.isVersionGreaterThanHook([7]);
    
    describe('transformArguments', () => {
        it('without pattern', () => {
            assert.deepEqual(
                transformArguments(),
                ['PUBSUB', 'SHARDCHANNELS']
            );
        });

        it('with pattern', () => {
            assert.deepEqual(
                transformArguments('patter*'),
                ['PUBSUB', 'SHARDCHANNELS', 'patter*']
            );
        });
    });

    testUtils.testWithClient('client.pubSubShardChannels', async client => {
        assert.deepEqual(
            await client.pubSubShardChannels(),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
