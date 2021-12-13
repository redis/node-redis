import { createClient } from 'redis-v3';
import { once } from 'events';
import { promisify } from 'util';

export default async (host, { randomString }) => {
    const client = createClient({ host }),
        setAsync = promisify(client.set).bind(client),
        getAsync = promisify(client.get).bind(client),
        delAsync = promisify(client.del).bind(client),
        quitAsync = promisify(client.quit).bind(client);

    await once(client, 'connect');

    return {
        benchmark() {
            return Promise.all([
                setAsync(randomString, randomString),
                getAsync(randomString),
                delAsync(randomString)
            ]);
        },
        teardown() {
            return quitAsync();
        }
    };

};
