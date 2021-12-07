import { createClient } from '@node-redis/client';

export default async (host) => {
    const client = createClient({ host });

    await client.connect();

    return {
        benchmark() {
            return client.ping();
        },
        teardown() {
            return client.disconnect();
        }
    };
};
