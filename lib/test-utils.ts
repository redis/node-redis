import RedisClient, { RedisClientOptions, RedisClientType } from './client.js';
import { RedisModules } from './commands/index.js';

export function itWithClient(title: string, options: RedisClientOptions, fn: (client: RedisClientType<RedisModules>) => Promise<void>) {
    it(title, async () => {
        const client = RedisClient.create(options);

        try {
            await client.connect();
            await client.flushAll();
            await fn(client);
        } finally {
            await client.disconnect();
        }
    });
}