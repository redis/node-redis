import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PING';

describe('PING', () => {
    describe('transformArguments', () => {
        it('default', () => {
            assert.deepEqual(
                transformArguments(),
                ['PING']
            );
        });

        it('with message', () => {
            assert.deepEqual(
                transformArguments('message'),
                ['PING', 'message']
            );
        });
    });

    describe('client.ping', () => {
        testUtils.testWithClient('string', async client => {
            assert.equal(
                await client.ping(),
                'PONG'
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('buffer', async client => {
            assert.deepEqual(
                await client.ping(client.commandOptions({ returnBuffers: true })),
                Buffer.from('PONG')
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});
