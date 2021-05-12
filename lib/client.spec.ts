import { strict as assert } from 'assert';
import RedisClient from './client.js';

describe('Client', () => {
    describe.skip('authentication', () => {
        it('Should fire auth command', async () => {
            const client = RedisClient.create({
                socket: {
                    password: 'password'
                }
            });

            await client.connect();

            assert.equal(
                await client.ping(),
                'PONG'
            );

            await client.disconnect();
        });
    });

    it('sendCommand', async () => {
        const client = RedisClient.create();

        await client.connect();
        assert.deepEqual(await client.sendCommand(['PING']), 'PONG');
        await client.disconnect();
    });
});