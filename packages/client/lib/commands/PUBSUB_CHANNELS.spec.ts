import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PUBSUB_CHANNELS';

describe('PUBSUB CHANNELS', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['PUBSUB', 'CHANNELS']
            );
        });

        it('with pattern', () => {
            assert.deepEqual(
                transformArguments('patter*'),
                ['PUBSUB', 'CHANNELS', 'patter*']
            );
        });
    });

    testUtils.testWithClient('client.pubSubChannels', async client => {
        assert.deepEqual(
            await client.pubSubChannels(),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
