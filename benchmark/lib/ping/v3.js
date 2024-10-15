import { createClient } from 'redis-v3';
import { once } from 'node:events';
import { promisify } from 'node:util';

export default async (host) => {
    const client = createClient({ host }),
        pingAsync = promisify(client.ping).bind(client),
        quitAsync = promisify(client.quit).bind(client);

    await once(client, 'connect');

    return {
        benchmark() {
            return pingAsync();
        },
        teardown() {
            return quitAsync();
        }
    };

};
