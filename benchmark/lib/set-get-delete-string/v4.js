import { createClient } from '@node-redis/client';

export default async (host, { randomString }) => {
    const client = createClient({ host });

    await client.connect();

    return {
        benchmark() {
            return Promise.all([
                client.set(randomString, randomString),
                client.get(randomString),
                client.del(randomString)
            ]);
        },
        teardown() {
            return client.disconnect();
        }
    };
};
